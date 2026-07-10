"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import {
  acknowledgeBroadcastNotificationSchema,
  sendBroadcastNotificationSchema,
} from "@/lib/validators/broadcast-notification.schema";

export type BroadcastNotificationActionState = {
  error?: string;
  success?: string;
};

function revalidateBroadcastPaths() {
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
  revalidatePath("/profile", "layout");
  revalidatePath("/rankings", "layout");
}

export async function sendBroadcastNotificationAction(
  _prev: BroadcastNotificationActionState,
  formData: FormData,
): Promise<BroadcastNotificationActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden." };

  const parsed = sendBroadcastNotificationSchema.safeParse({
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broadcast_notifications")
    .insert({
      message: parsed.data.message,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to send." };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "broadcast_notification.sent",
    entity_type: "broadcast_notifications",
    entity_id: data.id,
    metadata: { message_length: parsed.data.message.length },
  });

  revalidateBroadcastPaths();
  return { success: "Notification sent to all employees." };
}

export async function acknowledgeBroadcastNotificationAction(
  _prev: BroadcastNotificationActionState,
  formData: FormData,
): Promise<BroadcastNotificationActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "employee") return { error: "Forbidden." };

  const parsed = acknowledgeBroadcastNotificationSchema.safeParse({
    notification_id: formData.get("notification_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: notification, error: fetchError } = await supabase
    .from("broadcast_notifications")
    .select("id")
    .eq("id", parsed.data.notification_id)
    .maybeSingle();

  if (fetchError || !notification) {
    return { error: "Notification not found." };
  }

  const { error } = await supabase
    .from("broadcast_notification_acknowledgments")
    .insert({
      notification_id: parsed.data.notification_id,
      employee_id: profile.id,
    });

  if (error) {
    if (error.code === "23505") {
      revalidateBroadcastPaths();
      return { success: "Acknowledged." };
    }
    return { error: error.message };
  }

  revalidateBroadcastPaths();
  return { success: "Acknowledged." };
}
