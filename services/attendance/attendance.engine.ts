import {
  addDaysToDateString,
  startOfMonthDateString,
  startOfWeekDateString,
} from "@/lib/utils/dates";

export type AttendanceStatus =
  | "present"
  | "late"
  | "paid_leave"
  | "half_day"
  | "short_leave"
  | "absent"
  | "sunday_leave";

export type ShortLeaveType = "late_arrival" | "early_departure";

export const SHIFT_HOURS = 8;

export const DEFAULT_LEAVE_ALLOWANCES = {
  paid_leave: 1,
  overtime_hours: 0,
  half_day: 1,
  short_leave: 1,
  late: 4,
} as const;

export function overtimeHoursToPaidLeave(hours: number): number {
  if (hours <= 0) return 0;
  return Math.round((hours / SHIFT_HOURS) * 100) / 100;
}

export type AttendanceRecordInput = {
  attendance_date: string;
  status: AttendanceStatus;
  short_leave_type?: ShortLeaveType | null;
  is_auto_generated?: boolean;
};

export type LeaveAllowances = {
  paid_leave: number;
  overtime_hours: number;
  half_day: number;
  short_leave: number;
  late: number;
};

export type SalarySummary = {
  total_working_days: number;
  absent_days: number;
  extra_half_days: number;
  salaried_days: number;
  monthly_salary: number | null;
  daily_rate: number | null;
  calculated_salary: number | null;
};

export type LeaveBalanceSummary = LeaveAllowances & {
  paid_leave_base: number;
  overtime_paid_leave_credit: number;
  paid_leave_carried_forward: number;
  paid_leave_used: number;
  half_day_used: number;
  short_leave_used: number;
  late_used: number;
  penalty_half_days: number;
  auto_sunday_absents: number;
  paid_leave_remaining: number;
  half_day_remaining: number;
  short_leave_remaining: number;
  late_remaining: number;
};

function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

function weekSunday(monday: string): string {
  return addDaysToDateString(monday, 6);
}

function isInMonth(date: string, monthStart: string): boolean {
  const d = date.slice(0, 10);
  return d.slice(0, 7) === monthStart.slice(0, 7);
}

/** Count absences Mon–Sat in the ISO week containing `weekMonday`. */
export function countWeekAbsences(
  records: AttendanceRecordInput[],
  weekMonday: string,
): number {
  const saturday = addDaysToDateString(weekMonday, 5);
  return records.filter(
    (r) =>
      !r.is_auto_generated &&
      r.attendance_date >= weekMonday &&
      r.attendance_date <= saturday &&
      r.status === "absent",
  ).length;
}

/** @deprecated Use countWeekAbsences */
export function countWeekLeaves(
  records: AttendanceRecordInput[],
  weekMonday: string,
): number {
  return countWeekAbsences(records, weekMonday);
}

/** Sundays auto-marked absent when >2 absences Mon–Sat in the same week. */
export function sundaysRequiringAutoAbsent(
  records: AttendanceRecordInput[],
): string[] {
  const weeks = new Set<string>();
  for (const r of records) {
    if (r.status === "absent" && !r.is_auto_generated) {
      weeks.add(startOfWeekDateString(r.attendance_date));
    }
  }

  const required: string[] = [];
  for (const monday of weeks) {
    if (countWeekAbsences(records, monday) > 2) {
      required.push(weekSunday(monday));
    }
  }
  return required;
}

/** @deprecated Use sundaysRequiringAutoAbsent */
export function sundaysRequiringAutoLeave(
  records: AttendanceRecordInput[],
): string[] {
  return sundaysRequiringAutoAbsent(records);
}

export function computeLeaveBalance(
  records: AttendanceRecordInput[],
  monthStart: string,
  allowances: LeaveAllowances = { ...DEFAULT_LEAVE_ALLOWANCES },
  carryForward = 0,
): LeaveBalanceSummary {
  const monthRecords = records.filter((r) =>
    isInMonth(r.attendance_date, monthStart),
  );

  const basePaidLeave = allowances.paid_leave;
  const overtimeCredit = overtimeHoursToPaidLeave(allowances.overtime_hours);
  const monthlyPaidLeave = basePaidLeave + overtimeCredit;
  const totalPaidLeave = monthlyPaidLeave + carryForward;

  const paidLeaveUsed = monthRecords.filter(
    (r) => r.status === "paid_leave",
  ).length;
  const halfDayUsed = monthRecords.filter((r) => r.status === "half_day").length;
  const shortLeaveUsed = monthRecords.filter(
    (r) => r.status === "short_leave",
  ).length;
  const lateCount = monthRecords.filter((r) => r.status === "late").length;
  const autoSundayAbsents = monthRecords.filter(
    (r) => r.status === "absent" && r.is_auto_generated && isSunday(r.attendance_date),
  ).length;

  const lateUsed = Math.min(lateCount, allowances.late);
  const penaltyHalfDays = Math.max(0, lateCount - allowances.late);
  const totalHalfDayUsed = halfDayUsed + penaltyHalfDays;

  return {
    paid_leave: totalPaidLeave,
    overtime_hours: allowances.overtime_hours,
    half_day: allowances.half_day,
    short_leave: allowances.short_leave,
    late: allowances.late,
    paid_leave_base: basePaidLeave,
    overtime_paid_leave_credit: overtimeCredit,
    paid_leave_carried_forward: carryForward,
    paid_leave_used: paidLeaveUsed,
    half_day_used: totalHalfDayUsed,
    short_leave_used: shortLeaveUsed,
    late_used: lateUsed,
    penalty_half_days: penaltyHalfDays,
    auto_sunday_absents: autoSundayAbsents,
    paid_leave_remaining: totalPaidLeave - paidLeaveUsed,
    half_day_remaining: allowances.half_day - totalHalfDayUsed,
    short_leave_remaining: allowances.short_leave - shortLeaveUsed,
    late_remaining: allowances.late - lateUsed,
  };
}

/** Months from `start` inclusive to `end` exclusive (YYYY-MM-01 strings). */
export function monthsUntil(start: string, endExclusive: string): string[] {
  const months: string[] = [];
  let cursor = startOfMonthDateString(start);
  const end = startOfMonthDateString(endExclusive);
  while (cursor < end) {
    months.push(cursor);
    const { to } = monthDateRange(cursor);
    cursor = startOfMonthDateString(addDaysToDateString(to, 1));
  }
  return months;
}

/** Unused paid leave carried into `targetMonthStart` from all prior months. */
export function computePaidLeaveCarryForward(
  allRecords: AttendanceRecordInput[],
  targetMonthStart: string,
  getBaseAllowances: (monthStart: string) => LeaveAllowances,
  options?: {
    hireDate?: string | null;
    balanceMonths?: string[];
  },
): number {
  const merged = applyWeeklySundayRules(allRecords);
  const target = startOfMonthDateString(targetMonthStart);

  const candidates: string[] = [target];
  if (merged[0]?.attendance_date) {
    candidates.push(startOfMonthDateString(merged[0].attendance_date));
  }
  if (options?.hireDate) {
    candidates.push(startOfMonthDateString(options.hireDate));
  }
  for (const m of options?.balanceMonths ?? []) {
    candidates.push(startOfMonthDateString(m));
  }

  const firstMonth = candidates.reduce((min, c) => (c < min ? c : min));

  let carry = 0;
  for (const month of monthsUntil(firstMonth, target)) {
    const base = getBaseAllowances(month);
    const monthRecords = merged.filter((r) =>
      isInMonth(r.attendance_date, month),
    );
    const summary = computeLeaveBalance(monthRecords, month, base, carry);
    carry = Math.max(0, summary.paid_leave_remaining);
  }
  return carry;
}

export function computeLeaveBalanceForMonth(
  allRecords: AttendanceRecordInput[],
  targetMonthStart: string,
  getBaseAllowances: (monthStart: string) => LeaveAllowances,
  options?: {
    hireDate?: string | null;
    balanceMonths?: string[];
  },
): LeaveBalanceSummary {
  const month = startOfMonthDateString(targetMonthStart);
  const carry = computePaidLeaveCarryForward(
    allRecords,
    month,
    getBaseAllowances,
    options,
  );
  const merged = applyWeeklySundayRules(allRecords);
  const base = getBaseAllowances(month);
  const monthRecords = merged.filter((r) => isInMonth(r.attendance_date, month));
  return computeLeaveBalance(monthRecords, month, base, carry);
}

/** Merge auto Sunday absent records when >2 absences Mon–Sat in a week. */
export function applyWeeklySundayRules(
  records: AttendanceRecordInput[],
): AttendanceRecordInput[] {
  const manual = records.filter((r) => !r.is_auto_generated);
  const requiredSundays = new Set(sundaysRequiringAutoAbsent(manual));

  const withoutAuto = records.filter(
    (r) =>
      !(
        r.is_auto_generated &&
        (r.status === "absent" || r.status === "sunday_leave") &&
        isSunday(r.attendance_date)
      ),
  );

  const merged = [...withoutAuto];
  for (const sunday of requiredSundays) {
    const existing = merged.find((r) => r.attendance_date === sunday);
    if (existing) {
      if (existing.is_auto_generated) {
        existing.status = "absent";
      }
      continue;
    }
    merged.push({
      attendance_date: sunday,
      status: "absent",
      is_auto_generated: true,
    });
  }

  return merged.sort((a, b) => a.attendance_date.localeCompare(b.attendance_date));
}

/** @deprecated Use applyWeeklySundayRules */
export function applyWeeklySundayLeaves(
  records: AttendanceRecordInput[],
): AttendanceRecordInput[] {
  return applyWeeklySundayRules(records);
}

export function monthDateRange(monthStart: string): { from: string; to: string } {
  const year = Number(monthStart.slice(0, 4));
  const month = Number(monthStart.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: monthStart,
    to: `${monthStart.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Dates Mon–Sat in month for attendance grid (excludes Sundays). */
export function workingDaysInMonth(monthStart: string): string[] {
  const { from, to } = monthDateRange(monthStart);
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    if (!isSunday(cursor)) {
      days.push(cursor);
    }
    cursor = addDaysToDateString(cursor, 1);
  }
  return days;
}

export type GridDay = {
  date: string;
  dayNum: number;
  inMonth: boolean;
  isSunday: boolean;
  status: AttendanceStatus | null;
  shortLeaveType: ShortLeaveType | null;
  isAutoGenerated: boolean;
};

export function buildMonthCalendarGrid(
  monthStart: string,
  records: AttendanceRecordInput[],
): GridDay[][] {
  const { from, to } = monthDateRange(monthStart);
  const recordMap = new Map(
    records.map((r) => [r.attendance_date.slice(0, 10), r]),
  );

  const gridStart = startOfWeekDateString(from);
  const gridEnd = addDaysToDateString(startOfWeekDateString(to), 6);

  const weeks: GridDay[][] = [];
  let week: GridDay[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const inMonth = cursor >= from && cursor <= to;
    const sunday = isSunday(cursor);
    const rec = recordMap.get(cursor);

    week.push({
      date: cursor,
      dayNum: Number(cursor.slice(8, 10)),
      inMonth,
      isSunday: sunday,
      status: rec?.status ?? null,
      shortLeaveType: rec?.short_leave_type ?? null,
      isAutoGenerated: rec?.is_auto_generated ?? false,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor = addDaysToDateString(cursor, 1);
  }

  return weeks;
}

export function currentMonthStart(today: string): string {
  return startOfMonthDateString(today);
}

function eligibleWorkingDays(
  monthStart: string,
  hireDate?: string | null,
): string[] {
  const days = workingDaysInMonth(monthStart);
  if (!hireDate || !isInMonth(hireDate, monthStart)) {
    return days;
  }
  return days.filter((d) => d >= hireDate.slice(0, 10));
}

export function computeSalarySummary(
  records: AttendanceRecordInput[],
  monthStart: string,
  allowances: LeaveAllowances,
  monthlySalary: number | null,
  options?: { hireDate?: string | null },
): SalarySummary {
  const merged = applyWeeklySundayRules(records);
  const monthRecords = merged.filter((r) =>
    isInMonth(r.attendance_date, monthStart),
  );

  const workingDays = eligibleWorkingDays(monthStart, options?.hireDate);
  const totalWorkingDays = workingDays.length;

  let absentDays = 0;
  for (const rec of monthRecords) {
    if (rec.status === "absent") {
      absentDays += 1;
    }
  }

  const halfDayUsed = monthRecords.filter((r) => r.status === "half_day").length;
  const lateCount = monthRecords.filter((r) => r.status === "late").length;
  const penaltyHalfDays = Math.max(0, lateCount - allowances.late);
  const totalHalfDays = halfDayUsed + penaltyHalfDays;
  const extraHalfDays = Math.max(0, totalHalfDays - allowances.half_day);

  const salariedDays = Math.max(
    0,
    Math.round((totalWorkingDays - absentDays - extraHalfDays * 0.5) * 100) /
      100,
  );

  const dailyRate =
    monthlySalary !== null && totalWorkingDays > 0
      ? Math.round((monthlySalary / totalWorkingDays) * 100) / 100
      : null;

  const calculatedSalary =
    dailyRate !== null
      ? Math.round(dailyRate * salariedDays * 100) / 100
      : null;

  return {
    total_working_days: totalWorkingDays,
    absent_days: absentDays,
    extra_half_days: extraHalfDays,
    salaried_days: salariedDays,
    monthly_salary: monthlySalary,
    daily_rate: dailyRate,
    calculated_salary: calculatedSalary,
  };
}
