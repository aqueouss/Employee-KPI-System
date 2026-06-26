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

export const DEFAULT_LEAVE_ALLOWANCES = {
  paid_leave: 1,
  half_day: 1,
  short_leave: 1,
  late: 4,
} as const;

export type AttendanceRecordInput = {
  attendance_date: string;
  status: AttendanceStatus;
  short_leave_type?: ShortLeaveType | null;
  is_auto_generated?: boolean;
};

export type LeaveAllowances = {
  paid_leave: number;
  half_day: number;
  short_leave: number;
  late: number;
};

export type LeaveBalanceSummary = LeaveAllowances & {
  paid_leave_used: number;
  half_day_used: number;
  short_leave_used: number;
  late_used: number;
  penalty_half_days: number;
  sunday_leaves: number;
  paid_leave_remaining: number;
  half_day_remaining: number;
  short_leave_remaining: number;
  late_remaining: number;
};

const LEAVE_STATUSES: AttendanceStatus[] = [
  "paid_leave",
  "half_day",
  "short_leave",
];

function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

function weekSunday(monday: string): string {
  return addDaysToDateString(monday, 6);
}

function isInMonth(date: string, monthStart: string): boolean {
  return date.slice(0, 7) === monthStart.slice(0, 7);
}

/** Count paid/half/short leaves Mon–Sat in the ISO week containing `date`. */
export function countWeekLeaves(
  records: AttendanceRecordInput[],
  weekMonday: string,
): number {
  const saturday = addDaysToDateString(weekMonday, 5);
  return records.filter(
    (r) =>
      !r.is_auto_generated &&
      r.attendance_date >= weekMonday &&
      r.attendance_date <= saturday &&
      LEAVE_STATUSES.includes(r.status),
  ).length;
}

/** Sundays that should be auto-marked when >2 leaves Mon–Sat in the same week. */
export function sundaysRequiringAutoLeave(
  records: AttendanceRecordInput[],
): string[] {
  const weeks = new Set<string>();
  for (const r of records) {
    if (LEAVE_STATUSES.includes(r.status) && !r.is_auto_generated) {
      weeks.add(startOfWeekDateString(r.attendance_date));
    }
  }

  const required: string[] = [];
  for (const monday of weeks) {
    if (countWeekLeaves(records, monday) > 2) {
      required.push(weekSunday(monday));
    }
  }
  return required;
}

export function computeLeaveBalance(
  records: AttendanceRecordInput[],
  monthStart: string,
  allowances: LeaveAllowances = { ...DEFAULT_LEAVE_ALLOWANCES },
): LeaveBalanceSummary {
  const monthRecords = records.filter((r) =>
    isInMonth(r.attendance_date, monthStart),
  );

  const paidLeaveUsed = monthRecords.filter(
    (r) => r.status === "paid_leave" || r.status === "sunday_leave",
  ).length;
  const halfDayUsed = monthRecords.filter((r) => r.status === "half_day").length;
  const shortLeaveUsed = monthRecords.filter(
    (r) => r.status === "short_leave",
  ).length;
  const lateCount = monthRecords.filter((r) => r.status === "late").length;
  const sundayLeaves = monthRecords.filter(
    (r) => r.status === "sunday_leave",
  ).length;

  const lateUsed = Math.min(lateCount, allowances.late);
  const penaltyHalfDays = Math.max(0, lateCount - allowances.late);
  const totalHalfDayUsed = halfDayUsed + penaltyHalfDays;

  return {
    ...allowances,
    paid_leave_used: paidLeaveUsed,
    half_day_used: totalHalfDayUsed,
    short_leave_used: shortLeaveUsed,
    late_used: lateUsed,
    penalty_half_days: penaltyHalfDays,
    sunday_leaves: sundayLeaves,
    paid_leave_remaining: allowances.paid_leave - paidLeaveUsed,
    half_day_remaining: allowances.half_day - totalHalfDayUsed,
    short_leave_remaining: allowances.short_leave - shortLeaveUsed,
    late_remaining: allowances.late - lateUsed,
  };
}

/** Merge auto Sunday leave records based on weekly >2 leave rule. */
export function applyWeeklySundayLeaves(
  records: AttendanceRecordInput[],
): AttendanceRecordInput[] {
  const manual = records.filter((r) => !r.is_auto_generated);
  const requiredSundays = new Set(sundaysRequiringAutoLeave(manual));

  const withoutAuto = records.filter(
    (r) => !(r.is_auto_generated && r.status === "sunday_leave"),
  );

  const merged = [...withoutAuto];
  for (const sunday of requiredSundays) {
    const existing = merged.find((r) => r.attendance_date === sunday);
    if (existing) {
      if (existing.is_auto_generated) {
        existing.status = "sunday_leave";
      }
      continue;
    }
    merged.push({
      attendance_date: sunday,
      status: "sunday_leave",
      is_auto_generated: true,
    });
  }

  return merged.sort((a, b) => a.attendance_date.localeCompare(b.attendance_date));
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

export function currentMonthStart(today: string): string {
  return startOfMonthDateString(today);
}
