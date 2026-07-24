import { createClient } from "@/lib/supabase/server";
import {
  countUnseenAttendanceNotifications,
  loadUnseenAttendanceNotificationMessage,
} from "@/lib/attendance/attendance-notifications";
import { countPendingBroadcastNotifications } from "@/lib/broadcast-notifications";
import type { Profile } from "@/types/domain";

export type NotificationCounts = Record<string, number>;

export type EmployeeNotificationExtras = {
  attendanceMessage: string | null;
};

/**
 * Pending-action counts used to drive nav badges and browser notifications.
 * Admin: tasks awaiting approval, active warnings, open reviews, pending rewards.
 * Employee: tasks an admin added that the employee hasn't seen yet.
 */
export async function getNotificationCounts(
  profile: Profile,
  existingClient?: Awaited<ReturnType<typeof createClient>>,
): Promise<NotificationCounts> {
  const supabase = existingClient ?? (await createClient());

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

  const [{ count: newTasks }, broadcasts, attendanceMarked, { count: rewardEligible }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", profile.id)
        .eq("created_by_admin", true)
        .eq("seen_by_employee", false),
      countPendingBroadcastNotifications(supabase, profile.id),
      countUnseenAttendanceNotifications(supabase, profile.id),
      supabase
        .from("rewards")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", profile.id)
        .eq("status", "eligible"),
    ]);

  return {
    newTasks: newTasks ?? 0,
    broadcasts,
    attendanceMarked,
    rewardEligible: rewardEligible ?? 0,
  };
}

export async function getEmployeeNotificationExtras(
  profile: Profile,
  existingClient?: Awaited<ReturnType<typeof createClient>>,
): Promise<EmployeeNotificationExtras> {
  const supabase = existingClient ?? (await createClient());
  const attendanceMessage = await loadUnseenAttendanceNotificationMessage(
    supabase,
    profile.id,
  );
  return { attendanceMessage };
}
