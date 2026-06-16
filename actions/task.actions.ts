"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, isEditableDate } from "@/lib/utils/dates";
import { getKpiRules, upsertDailySnapshot } from "@/services/kpi/kpi.service";
import {
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
  revalidatePath("/employee");
}

function revalidateApprovalViews() {
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const today = getTodayDateString();
  if (!isEditableDate(parsed.data.task_date, today)) {
    return { error: "Cannot add tasks to a past date." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    employee_id: profile.id,
    title: parsed.data.title,
    task_date: parsed.data.task_date,
  });

  if (error) return { error: error.message };

  revalidateTaskViews();
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
    .select("task_date, employee_id, status")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.employee_id !== profile.id) return { error: "Forbidden." };

  const today = getTodayDateString();
  if (!isEditableDate(task.task_date, today)) {
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
    .select("status")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.status !== "submitted") {
    return { error: "Only submitted tasks can be reviewed." };
  }

  const approve = parsed.data.decision === "approve";
  const now = new Date().toISOString();

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
    action: approve ? "task.approved" : "task.rejected",
    entity_type: "task",
    entity_id: parsed.data.id,
    metadata: parsed.data.note ? { note: parsed.data.note } : {},
  });

  revalidateApprovalViews();
  revalidateTaskViews();
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
    .select("task_date, employee_id, status")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.employee_id !== profile.id) return { error: "Forbidden." };

  const today = getTodayDateString();
  if (!isEditableDate(task.task_date, today)) {
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
    .select("task_date, employee_id, status")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !task) return { error: "Task not found." };
  if (task.employee_id !== profile.id) return { error: "Forbidden." };

  const today = getTodayDateString();
  if (!isEditableDate(task.task_date, today)) {
    return { error: "Past tasks are locked." };
  }

  if (task.status !== "pending") {
    return {
      error: "Only to-do tasks can be deleted. Ask an admin to remove others.",
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
    .select("employee_id, task_date")
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

  // Recompute the finalized snapshot for that day (if one exists) so KPI
  // history reflects the deletion. Uses the service-role client.
  try {
    const admin = createAdminClient();
    const { data: snapshot } = await admin
      .from("daily_kpi_snapshots")
      .select("id")
      .eq("employee_id", task.employee_id)
      .eq("kpi_date", task.task_date)
      .maybeSingle();

    if (snapshot) {
      const rules = await getKpiRules(admin);
      await upsertDailySnapshot(admin, task.employee_id, task.task_date, rules);
    }
  } catch {
    // Snapshot recompute is best-effort; the daily pipeline will reconcile.
  }

  revalidateTaskViews();
  revalidateApprovalViews();
  revalidatePath(`/admin/employees/${task.employee_id}`);
  return { success: true };
}
