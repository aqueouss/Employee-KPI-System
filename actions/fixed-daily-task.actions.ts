"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import {
  createFixedDailyTaskSchema,
  fixedDailyTaskIdSchema,
  MAX_FIXED_DAILY_TASKS,
  updateFixedDailyTaskSchema,
} from "@/lib/validators/fixed-daily-task.schema";

export type FixedDailyTaskActionState = {
  error?: string;
  success?: boolean;
};

function revalidate(employeeId: string) {
  revalidatePath(`/admin/employees/${employeeId}`);
}

export async function createFixedDailyTaskAction(
  _prev: FixedDailyTaskActionState,
  formData: FormData,
): Promise<FixedDailyTaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden." };

  const parsed = createFixedDailyTaskSchema.safeParse({
    employee_id: formData.get("employee_id"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("employee_fixed_daily_tasks")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", parsed.data.employee_id);

  if ((count ?? 0) >= MAX_FIXED_DAILY_TASKS) {
    return {
      error: `You can only save up to ${MAX_FIXED_DAILY_TASKS} fixed daily tasks.`,
    };
  }

  const { error } = await supabase.from("employee_fixed_daily_tasks").insert({
    employee_id: parsed.data.employee_id,
    title: parsed.data.title,
  });
  if (error) return { error: error.message };

  revalidate(parsed.data.employee_id);
  return { success: true };
}

export async function updateFixedDailyTaskAction(
  _prev: FixedDailyTaskActionState,
  formData: FormData,
): Promise<FixedDailyTaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden." };

  const parsed = updateFixedDailyTaskSchema.safeParse({
    id: formData.get("id"),
    employee_id: formData.get("employee_id"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_fixed_daily_tasks")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.id)
    .eq("employee_id", parsed.data.employee_id);
  if (error) return { error: error.message };

  revalidate(parsed.data.employee_id);
  return { success: true };
}

export async function deleteFixedDailyTaskAction(
  _prev: FixedDailyTaskActionState,
  formData: FormData,
): Promise<FixedDailyTaskActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden." };

  const parsed = fixedDailyTaskIdSchema.safeParse({
    id: formData.get("id"),
    employee_id: formData.get("employee_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_fixed_daily_tasks")
    .delete()
    .eq("id", parsed.data.id)
    .eq("employee_id", parsed.data.employee_id);
  if (error) return { error: error.message };

  revalidate(parsed.data.employee_id);
  return { success: true };
}
