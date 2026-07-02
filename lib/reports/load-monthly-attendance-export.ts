import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { attendanceDayCode } from "@/lib/reports/attendance-code";
import { formatOvertimeHours } from "@/lib/reports/format-overtime";
import { formatMonthLabel } from "@/lib/payroll/format-month-label";
import { createClient } from "@/lib/supabase/server";
import {
  calendarDaysInMonth,
  monthDateRange,
} from "@/services/attendance/attendance.engine";
import { startOfMonthDateString } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

export type MonthlyAttendanceExportRow = {
  serial: number;
  name: string;
  days: Record<number, string>;
  total: number;
  balancePrevious: number;
  newBalance: number;
  overtime: string;
  late: number;
};

export type MonthlyAttendanceExport = {
  monthStart: string;
  monthLabel: string;
  daysInMonth: number;
  rows: MonthlyAttendanceExportRow[];
  totalDays: number;
};

export async function loadMonthlyAttendanceExport(
  month: string,
): Promise<MonthlyAttendanceExport> {
  const monthStart = startOfMonthDateString(month);
  const { to: monthEnd } = monthDateRange(monthStart);
  const daysInMonth = calendarDaysInMonth(monthStart).length;
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, hire_date")
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name");

  const list = (employees ?? []) as Pick<
    Tables<"profiles">,
    "id" | "full_name" | "hire_date"
  >[];

  const rows: MonthlyAttendanceExportRow[] = [];

  for (const [index, employee] of list.entries()) {
    const { weeks, summary, salarySummary } = await loadMonthAttendance(
      employee.id,
      monthStart,
    );
    const days: Record<number, string> = {};

    for (const week of weeks) {
      for (const day of week) {
        if (!day.inMonth) continue;
        days[day.dayNum] = attendanceDayCode(day, employee.hire_date);
      }
    }

    if (employee.hire_date && employee.hire_date > monthEnd) {
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum += 1) {
        days[dayNum] = "";
      }
    }

    rows.push({
      serial: index + 1,
      name: employee.full_name,
      days,
      total: salarySummary.salaried_days,
      balancePrevious: summary.paid_leave_carried_forward,
      newBalance: summary.paid_leave_remaining,
      overtime: formatOvertimeHours(summary.overtime_hours),
      late: summary.late_used,
    });
  }

  return {
    monthStart,
    monthLabel: formatMonthLabel(monthStart).toUpperCase(),
    daysInMonth,
    rows,
    totalDays: rows.reduce((sum, row) => sum + row.total, 0),
  };
}
