import { createClient } from "@/lib/supabase/server";
import {
  endOfMonthDateString,
  getTodayDateString,
  normalizeDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import {
  applyWeeklySundayRules,
  buildMonthCalendarGrid,
  computeLeaveBalanceForMonth,
  computePayrollSummary,
  computeSalarySummary,
  DEFAULT_LEAVE_ALLOWANCES,
  type AttendanceRecordInput,
  type LeaveAllowances,
} from "@/services/attendance/attendance.engine";
import type { Tables } from "@/types/database.types";

function toAllowances(row: Tables<"leave_balances"> | undefined): LeaveAllowances {
  if (!row) return { ...DEFAULT_LEAVE_ALLOWANCES };
  return {
    paid_leave: Number(row.paid_leave_allowance),
    overtime_hours: Number(row.overtime_hours ?? 0),
    half_day: Number(row.half_day_allowance),
    short_leave: Number(row.short_leave_allowance),
    late: row.late_allowance,
  };
}

export async function loadMonthAttendance(
  employeeId: string,
  month: string,
) {
  const monthStart = startOfMonthDateString(month);
  const monthEnd = endOfMonthDateString(monthStart);
  const supabase = await createClient();

  const [
    { data: profile },
    { data: allRecordRows },
    { data: balanceRows },
    { data: monthRecordRows },
    { data: payrollRow },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("hire_date, monthly_salary")
      .eq("id", employeeId)
      .single(),
    supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .lte("attendance_date", monthEnd)
      .order("attendance_date", { ascending: true }),
    supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", employeeId)
      .lte("month", monthStart),
    supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("attendance_date", monthStart)
      .lte("attendance_date", monthEnd),
    supabase
      .from("monthly_payroll")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("month", monthStart)
      .maybeSingle(),
  ]);

  const balanceByMonth = new Map<string, Tables<"leave_balances">>();
  const balanceMonths: string[] = [];
  for (const row of (balanceRows ?? []) as Tables<"leave_balances">[]) {
    const key = normalizeDateString(row.month);
    balanceByMonth.set(key, row);
    balanceMonths.push(key);
  }

  const getBaseAllowances = (m: string): LeaveAllowances =>
    toAllowances(balanceByMonth.get(startOfMonthDateString(m)));

  const allInputs: AttendanceRecordInput[] = (
    (allRecordRows ?? []) as Tables<"attendance_records">[]
  ).map((r) => ({
    attendance_date: normalizeDateString(r.attendance_date),
    status: r.status,
    short_leave_type: r.short_leave_type,
    is_auto_generated: r.is_auto_generated,
  }));

  const summary = computeLeaveBalanceForMonth(allInputs, monthStart, getBaseAllowances, {
    hireDate: profile?.hire_date ?? null,
    balanceMonths,
  });

  const merged = applyWeeklySundayRules(allInputs).filter(
    (r) => r.attendance_date.slice(0, 7) === monthStart.slice(0, 7),
  );
  const weeks = buildMonthCalendarGrid(monthStart, merged);

  const baseAllowances = getBaseAllowances(monthStart);
  const salarySummary = computeSalarySummary(
    allInputs,
    monthStart,
    baseAllowances,
    profile?.monthly_salary != null ? Number(profile.monthly_salary) : null,
    {
      hireDate: profile?.hire_date ?? null,
      carryForward: summary.paid_leave_carried_forward,
      asOfDate: getTodayDateString(),
    },
  );

  const payrollSummary = computePayrollSummary(salarySummary, {
    incentives: Number(payrollRow?.incentives ?? 0),
    conveyance: Number(payrollRow?.conveyance ?? 0),
    advance_deduction: Number(payrollRow?.advance_deduction ?? 0),
  });

  const balanceRow = balanceByMonth.get(monthStart) ?? null;
  const recordRows = (monthRecordRows ?? []) as Tables<"attendance_records">[];

  return {
    monthStart,
    monthEnd,
    recordRows,
    balanceRow,
    payrollRow: (payrollRow ?? null) as Tables<"monthly_payroll"> | null,
    summary,
    salarySummary,
    payrollSummary,
    weeks,
    inputs: merged,
  };
}
