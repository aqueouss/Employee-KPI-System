import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type BroadcastNotification = {
  id: string;
  message: string;
  created_at: string;
};

export async function loadLatestBroadcastNotification(
  client: Client,
): Promise<BroadcastNotification | null> {
  const { data, error } = await client
    .from("broadcast_notifications")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function loadPendingBroadcastNotification(
  client: Client,
  employeeId: string,
): Promise<BroadcastNotification | null> {
  const latest = await loadLatestBroadcastNotification(client);
  if (!latest) return null;

  const { data: acknowledgment } = await client
    .from("broadcast_notification_acknowledgments")
    .select("notification_id")
    .eq("notification_id", latest.id)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (acknowledgment) return null;
  return latest;
}

export async function countBroadcastAcknowledgments(
  client: Client,
  notificationId: string,
): Promise<number> {
  const { count, error } = await client
    .from("broadcast_notification_acknowledgments")
    .select("notification_id", { count: "exact", head: true })
    .eq("notification_id", notificationId);

  if (error) return 0;
  return count ?? 0;
}
