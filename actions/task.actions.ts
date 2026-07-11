"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getTodayDateString,
  isEditableDate,
  isTaskEditableNow,
  periodStartDate,
  addDaysToDateString,
  type TaskPeriod,
} from "@/lib/utils/dates";
import { getKpiRules, markWeeklyOverdueRedSnapshots, upsertDailySnapshot } from "@/services/kpi/kpi.service";
import { reconcileMonthlyWarning } from "@/services/warnings/warning.service";
import {
  adminCreateTaskSchema,
  createTaskSchema,
  deleteTaskSchema,
  reviewTaskSchema,
  toggleTaskSchema,
  updateTaskSchema,
} from "@/lib/validators/task.schema";

export type TaskActionState = {
  error?: string;
  success?: boolean;
};

function revalidateTaskViews() {
  revalidatePath("/employee/tasks");
  revalidatePath("/employee", "layout");
}

function revalidateApprovalViews() {
  revalidatePath("/admin", "layout");
}

/** Recompute KPI impact after task approval or deletion. */
async function recomputeKpiAfterTaskChange(
  employeeId: string,
  taskDate: string,
  period: TaskPeriod,
) {
  try {
    const admin = createAdminClient();
    const rules = await getKpiRules(admin);
    const today = getTodayDateString();

    if (period === "daily") {
      await upsertDailySnapshot(admin, employeeId, taskDate, rules);
      await reconcileMonthlyWarning(admin, employeeId, taskDate, rules, today);
      return;
    }

    if (period === "weekly") {
      await upsertDailySnapshot(admin, employeeId, taskDate, rules);
      await markWeeklyOverdueRedSnapshots(admin, employeeId, today, rules);
      await reconcileMonthlyWarning(admin, employeeId, taskDate, rules, today);
    }
  } catch {
    // Best-effort; the nightly pipeline will reconcile.
  }
}

export async function createTaskAction(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    task_date: formData.get("task_date"),
    period: formData.get("period") ?? "daily",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const today = getTodayDateString();
  const period = parsed.data.period;

  if (period === "custom") {
    return { error: "Custom tasks can only be added by an admin." };
  }

  // Non-daily tasks are auto-assigned to the current period's start date.
  const taskDate =
    period === "daily"
      ? parsed.data.task_date
      : periodStartDate(period, today);

  if (period === "daily" && !isEditableDate(taskDate, today)) {
    return { error: "Cannot add tasks to a past date." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    employee_id: profile.id,
    title: parsed.data.title,
    task_date: taskDate,
    period,
  });

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

/** Admin creates a task on behalf of an employee. */
export async function adminCreateTaskAction(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden. Admin only." };

  const employeeId = String(formData.get("employee_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return { error: "Invalid employee." };
  }

  const parsed = adminCreateTaskSchema.safeParse({
    title: formData.get("title"),
    task_date: formData.get("task_date"),
    period: formData.get("period") ?? "daily",
    due_date: formData.get("due_date") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const period = parsed.data.period;
  const today = getTodayDateString();
  let taskDate =
    period === "daily" || period === "custom"
      ? parsed.data.task_date
      : periodStartDate(period, today);
  let dueDate =
    period === "custom" && parsed.data.due_date
      ? parsed.data.due_date
      : null;

  if (period === "weekly") {
    taskDate = today;
    dueDate = addDaysToDateString(today, 7);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    employee_id: employeeId,
    title: parsed.data.title,
    task_date: taskDate,
    due_date: dueDate,
    period,
    created_by_admin: true,
    seen_by_employee: false,
  });

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "task.created_by_admin",
    entity_type: "task",
    entity_id: null,
    metadata: {
      employee_id: employeeId,
      task_date: taskDate,
      due_date: dueDate,
      period,
    },
  });

  revalidateTaskViews();
  revalidatePath(`/admin/employees/${employeeId}`);
  return { success: true };
}

/**
 * Employee submits a task for approval (completed=true) or withdraws a pending
 * submission back to "pending" (completed=false). Submitting does NOT mark the
 * task completed — an admin must approve it before it counts toward KPI.
 */
export async function toggleTaskAction(
  id: string,
  completed: boolean,
): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = toggleTaskSchema.safeParse({ id, completed });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("task_date, employee_id, status, period, due_date")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.employee_id !== profile.id) return { error: "Forbidden." };

  const today = getTodayDateString();
  if (!isTaskEditableNow(task.period, task.task_date, today, task.due_date)) {
    return { error: "Past tasks are locked." };
  }

  if (task.status === "completed") {
    return { error: "This task was approved by an admin and is locked." };
  }

  // Submitting: pending/rejected -> submitted. Withdrawing: submitted -> pending.
  const nextStatus = parsed.data.completed ? "submitted" : "pending";

  const { error } = await supabase
    .from("tasks")
    .update({
      status: nextStatus,
      submitted_at: parsed.data.completed ? new Date().toISOString() : null,
      completed_at: null,
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
    })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidateTaskViews();
  revalidateApprovalViews();
  return { success: true };
}

/**
 * Admin approves or rejects a submitted task. Approval marks it "completed"
 * (counts toward KPI); rejection marks it "rejected" (does not count).
 */
export async function reviewTaskAction(
  id: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden. Admin only." };

  const parsed = reviewTaskSchema.safeParse({ id, decision, note });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("status, employee_id, task_date, period")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };

  const approve = parsed.data.decision === "approve";

  if (approve) {
    if (task.status !== "submitted" && task.status !== "pending") {
      return {
        error: "Only pending or submitted tasks can be approved.",
      };
    }
  } else if (task.status !== "submitted" && task.status !== "completed") {
    return {
      error: "Only submitted or approved tasks can be rejected.",
    };
  }

  const now = new Date().toISOString();
  const wasApproved = task.status === "completed";
  const directApproval = approve && task.status === "pending";

  const { error } = await supabase
    .from("tasks")
    .update({
      status: approve ? "completed" : "rejected",
      completed_at: approve ? now : null,
      reviewed_by: profile.id,
      reviewed_at: now,
      review_note: parsed.data.note ? parsed.data.note : null,
    })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: approve
      ? directApproval
        ? "task.approved_directly"
        : "task.approved"
      : wasApproved
        ? "task.approval_revoked"
        : "task.rejected",
    entity_type: "task",
    entity_id: parsed.data.id,
    metadata: parsed.data.note ? { note: parsed.data.note } : {},
  });

  await recomputeKpiAfterTaskChange(
    task.employee_id,
    task.task_date,
    task.period,
  );

  revalidateApprovalViews();
  revalidateTaskViews();
  revalidatePath("/employee/kpi");
  revalidatePath("/employee/warnings");
  revalidatePath("/admin/warnings");
  revalidatePath("/admin/termination-reviews");
  revalidatePath("/rankings");
  revalidatePath(`/admin/employees/${task.employee_id}`);
  return { success: true };
}

export async function updateTaskAction(
  id: string,
  title: string,
): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = updateTaskSchema.safeParse({ id, title });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("task_date, employee_id, status, period, due_date, created_by_admin")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.employee_id !== profile.id) return { error: "Forbidden." };
  if (task.created_by_admin) {
    return { error: "Admin-assigned tasks cannot be edited." };
  }

  const today = getTodayDateString();
  if (!isTaskEditableNow(task.period, task.task_date, today, task.due_date)) {
    return { error: "Past tasks are locked." };
  }

  if (task.status === "submitted" || task.status === "completed") {
    return {
      error:
        "Withdraw the submission before editing (approved tasks are locked).",
    };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function deleteTaskAction(id: string): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = deleteTaskSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("task_date, employee_id, status, period, due_date, created_by_admin")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.employee_id !== profile.id) return { error: "Forbidden." };

  const today = getTodayDateString();
  if (!isTaskEditableNow(task.period, task.task_date, today, task.due_date)) {
    return { error: "Past tasks are locked." };
  }

  if (task.created_by_admin) {
    return {
      error: "Admin-assigned tasks cannot be deleted. Ask your admin to remove it.",
    };
  }

  if (task.status !== "pending") {
    return {
      error:
        task.status === "rejected"
          ? "Rejected tasks cannot be deleted. Edit and resubmit for approval."
          : "Only to-do tasks can be deleted. Ask an admin to remove others.",
    };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

/**
 * Admin deletes any employee's task, including approved (completed) ones.
 * If a finalized KPI snapshot already exists for that employee/date, it is
 * recomputed so historical KPI stays accurate after the deletion.
 */
export async function adminDeleteTaskAction(
  id: string,
): Promise<TaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden. Admin only." };

  const parsed = deleteTaskSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("employee_id, task_date, period")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "task.deleted_by_admin",
    entity_type: "task",
    entity_id: parsed.data.id,
    metadata: { employee_id: task.employee_id, task_date: task.task_date },
  });

  await recomputeKpiAfterTaskChange(
    task.employee_id,
    task.task_date,
    task.period,
  );

  revalidateTaskViews();
  revalidateApprovalViews();
  revalidatePath(`/admin/employees/${task.employee_id}`);
  return { success: true };
}
