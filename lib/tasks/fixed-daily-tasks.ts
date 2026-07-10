import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeDateString } from "@/lib/utils/dates";
import type { AttendanceStatus } from "@/types/domain";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export const FIXED_TASK_ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "present",
  "half_day",
  "short_leave",
  "late_half_day",
  "late_short_leave",
];

export function attendanceQualifiesForFixedTasks(status: string): boolean {
  return FIXED_TASK_ATTENDANCE_STATUSES.includes(status as AttendanceStatus);
}

export async function syncFixedDailyTasksForAttendance(
  client: Client,
  employeeId: string,
  attendanceDate: string,
  status: string,
): Promise<void> {
  if (!attendanceQualifiesForFixedTasks(status)) return;

  const date = normalizeDateString(attendanceDate);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("kpi_tracked")
    .eq("id", employeeId)
    .single();

  if (profileError || profile?.kpi_tracked === false) return;

  const { data: fixedTasks, error: fixedError } = await client
    .from("employee_fixed_daily_tasks")
    .select("id, title")
    .eq("employee_id", employeeId);

  if (fixedError || !fixedTasks?.length) return;

  const { data: existingRows, error: existingError } = await client
    .from("tasks")
    .select("source_fixed_task_id")
    .eq("employee_id", employeeId)
    .eq("task_date", date)
    .not("source_fixed_task_id", "is", null);

  if (existingError) return;

  const existingIds = new Set(
    (existingRows ?? [])
      .map((row) => row.source_fixed_task_id)
      .filter((id): id is string => Boolean(id)),
  );

  const toInsert = fixedTasks.filter((task) => !existingIds.has(task.id));
  if (toInsert.length === 0) return;

  const { error: insertError } = await client.from("tasks").insert(
    toInsert.map((task) => ({
      employee_id: employeeId,
      title: task.title,
      task_date: date,
      period: "daily" as const,
      source_fixed_task_id: task.id,
      created_by_admin: true,
      seen_by_employee: false,
    })),
  );

  if (insertError) {
    throw new Error(`Failed to sync fixed daily tasks: ${insertError.message}`);
  }
}
