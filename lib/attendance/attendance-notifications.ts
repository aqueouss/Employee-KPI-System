import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAttendanceMarkCaption,
  getFixedDailyTasksAddedCaption,
} from "@/lib/captions/funny-captions";
import { getTodayDateString, normalizeDateString } from "@/lib/utils/dates";
import type { AttendanceStatus, ShortLeaveType } from "@/types/domain";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type AttendanceMarkNotification = {
  id: string;
  message: string;
  status: AttendanceStatus;
  seen_at: string | null;
};

async function getCompanyToday(client: Client): Promise<string> {
  const { data } = await client
    .from("kpi_rules")
    .select("company_timezone")
    .eq("id", 1)
    .maybeSingle();

  return getTodayDateString(data?.company_timezone ?? "UTC");
}

export async function syncAttendanceMarkNotification(
  client: Client,
  params: {
    employeeId: string;
    attendanceDate: string;
    status: AttendanceStatus;
    shortLeaveType?: ShortLeaveType | null;
    fixedTasksAdded?: number;
  },
): Promise<void> {
  const date = normalizeDateString(params.attendanceDate);
  const today = await getCompanyToday(client);
  if (date !== today) return;

  const { data: employee, error: employeeError } = await client
    .from("profiles")
    .select("full_name, kpi_tracked")
    .eq("id", params.employeeId)
    .single();

  if (employeeError || !employee || employee.kpi_tracked === false) return;

  const seed = `${params.employeeId}-${date}-${params.status}`;
  const parts = [
    getAttendanceMarkCaption({
      status: params.status,
      employeeName: employee.full_name,
      shortLeaveType: params.shortLeaveType ?? null,
      seed,
    }),
  ];

  if ((params.fixedTasksAdded ?? 0) > 0) {
    parts.push(getFixedDailyTasksAddedCaption(seed));
  }

  const message = parts.join(" ");

  const { error } = await client.from("attendance_mark_notifications").upsert(
    {
      employee_id: params.employeeId,
      attendance_date: date,
      status: params.status,
      message,
      seen_at: null,
    },
    { onConflict: "employee_id,attendance_date" },
  );

  if (error) {
    throw new Error(`Failed to save attendance notification: ${error.message}`);
  }
}

export async function loadTodayAttendanceNotification(
  client: Client,
  employeeId: string,
): Promise<AttendanceMarkNotification | null> {
  const today = await getCompanyToday(client);
  const { data, error } = await client
    .from("attendance_mark_notifications")
    .select("id, message, status, seen_at")
    .eq("employee_id", employeeId)
    .eq("attendance_date", today)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    message: data.message,
    status: data.status as AttendanceStatus,
    seen_at: data.seen_at,
  };
}

export async function countUnseenAttendanceNotifications(
  client: Client,
  employeeId: string,
): Promise<number> {
  const today = await getCompanyToday(client);
  const { count, error } = await client
    .from("attendance_mark_notifications")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("attendance_date", today)
    .is("seen_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function loadUnseenAttendanceNotificationMessage(
  client: Client,
  employeeId: string,
): Promise<string | null> {
  const today = await getCompanyToday(client);
  const { data, error } = await client
    .from("attendance_mark_notifications")
    .select("message")
    .eq("employee_id", employeeId)
    .eq("attendance_date", today)
    .is("seen_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data.message;
}

export async function markAttendanceNotificationSeen(
  client: Client,
  notificationId: string,
  employeeId: string,
): Promise<void> {
  await client
    .from("attendance_mark_notifications")
    .update({ seen_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("employee_id", employeeId)
    .is("seen_at", null);
}
