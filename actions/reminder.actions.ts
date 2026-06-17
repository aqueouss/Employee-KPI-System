"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import {
  createReminderSchema,
  reminderIdSchema,
  resolveReminderSchema,
  updateReminderSchema,
} from "@/lib/validators/reminder.schema";

export type ReminderActionState = {
  error?: string;
  success?: boolean;
};

function revalidate() {
  revalidatePath("/employee/reminders");
  revalidatePath("/admin/reminders");
  revalidatePath("/admin");
}

export async function createReminderAction(
  _prevState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = createReminderSchema.safeParse({
    title: formData.get("title"),
    details: formData.get("details") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reminders").insert({
    employee_id: profile.id,
    title: parsed.data.title,
    details: parsed.data.details ? parsed.data.details : null,
  });
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function updateReminderAction(
  _prevState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = updateReminderSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    details: formData.get("details") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("reminders")
    .select("employee_id, status")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !existing) return { error: "Reminder not found." };
  if (existing.employee_id !== profile.id) return { error: "Forbidden." };
  if (existing.status !== "open") {
    return { error: "Only open reminders can be edited." };
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      title: parsed.data.title,
      details: parsed.data.details ? parsed.data.details : null,
    })
    .eq("id", parsed.data.id)
    .eq("employee_id", profile.id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function deleteReminderAction(
  _prevState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden. Admin only." };

  const parsed = reminderIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "reminder.deleted",
    entity_type: "reminder",
    entity_id: parsed.data.id,
    metadata: {},
  });

  revalidate();
  return { success: true };
}

export async function resolveReminderAction(
  _prevState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden. Admin only." };

  const parsed = resolveReminderSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reminders")
    .update({
      status: "resolved",
      resolved_by: profile.id,
      resolved_at: new Date().toISOString(),
      resolution_note: parsed.data.note ? parsed.data.note : null,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "reminder.resolved",
    entity_type: "reminder",
    entity_id: parsed.data.id,
    metadata: { note: parsed.data.note ?? "" },
  });

  revalidate();
  return { success: true };
}

export async function reopenReminderAction(
  _prevState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden. Admin only." };

  const parsed = reminderIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reminders")
    .update({
      status: "open",
      resolved_by: null,
      resolved_at: null,
      resolution_note: null,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}
