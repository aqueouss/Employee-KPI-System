import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

export type NotificationCounts = Record<string, number>;

/**
 * Pending-action counts used to drive nav badges and browser notifications.
 * Admin: tasks awaiting approval, active warnings, open reviews, pending rewards.
 * Employee: tasks an admin added that the employee hasn't seen yet.
 */
export async function getNotificationCounts(
  profile: Profile,
): Promise<NotificationCounts> {
  const supabase = await createClient();

  if (profile.role === "admin") {
    const [
      { count: approvals },
      { count: warnings },
      { count: reviews },
      { count: rewards },
      { count: reminders },
      { count: leaveRequests },
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("warnings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("termination_reviews")
        .select("id", { count: "exact", head: true })
        .in("status", ["eligible", "under_review"]),
      supabase
        .from("rewards")
        .select("id", { count: "exact", head: true })
        .eq("status", "eligible"),
      supabase
        .from("reminders")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return {
      approvals: approvals ?? 0,
      warnings: warnings ?? 0,
      reviews: reviews ?? 0,
      rewards: rewards ?? 0,
      reminders: reminders ?? 0,
      leaveRequests: leaveRequests ?? 0,
    };
  }

  const { count: newTasks } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", profile.id)
    .eq("created_by_admin", true)
    .eq("seen_by_employee", false);

  return { newTasks: newTasks ?? 0 };
}
