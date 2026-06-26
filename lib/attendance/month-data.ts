import { createClient } from "@/lib/supabase/server";
import {
  endOfMonthDateString,
  normalizeDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import {
  applyWeeklySundayLeaves,
  buildMonthCalendarGrid,
  computeLeaveBalance,
  type AttendanceRecordInput,
} from "@/services/attendance/attendance.engine";
import type { Tables } from "@/types/database.types";

export async function loadMonthAttendance(
  employeeId: string,
  month: string,
) {
  const monthStart = startOfMonthDateString(month);
  const monthEnd = endOfMonthDateString(monthStart);
  const supabase = await createClient();

  const [{ data: records }, { data: balance }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("attendance_date", monthStart)
      .lte("attendance_date", monthEnd),
    supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("month", monthStart)
      .maybeSingle(),
  ]);

  const recordRows = (records ?? []) as Tables<"attendance_records">[];
  const inputs: AttendanceRecordInput[] = recordRows.map((r) => ({
    attendance_date: normalizeDateString(r.attendance_date),
    status: r.status,
    short_leave_type: r.short_leave_type,
    is_auto_generated: r.is_auto_generated,
  }));

  const balanceRow = balance as Tables<"leave_balances"> | null;
  const allowances = balanceRow
    ? {
        paid_leave: Number(balanceRow.paid_leave_allowance),
        half_day: Number(balanceRow.half_day_allowance),
        short_leave: Number(balanceRow.short_leave_allowance),
        late: balanceRow.late_allowance,
      }
    : undefined;

  const merged = applyWeeklySundayLeaves(inputs);
  const monthRecords = merged.filter(
    (r) => r.attendance_date.slice(0, 7) === monthStart.slice(0, 7),
  );

  const summary = computeLeaveBalance(monthRecords, monthStart, allowances);
  const weeks = buildMonthCalendarGrid(monthStart, merged);

  return {
    monthStart,
    monthEnd,
    recordRows,
    balanceRow,
    summary,
    weeks,
    inputs: merged,
  };
}
