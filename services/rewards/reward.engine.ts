import type { AttendanceStatus, KpiFlag } from "@/types/domain";

/**
 * Pure reward streak engine. No I/O.
 *
 * Rule: N consecutive green-flag days ending at `asOfDate` => reward eligible.
 * Sundays and paid leave are skipped (neutral).
 * Red, yellow, and absent days break the streak.
 */

export interface StreakResult {
  length: number;
  startDate: string | null;
  endDate: string | null;
}

const NEUTRAL_ATTENDANCE: ReadonlySet<AttendanceStatus> = new Set(["paid_leave"]);

function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

export function isNeutralStreakDay(
  date: string,
  attendanceStatus?: AttendanceStatus | null,
): boolean {
  if (isSunday(date)) return true;
  if (!attendanceStatus) return false;
  return NEUTRAL_ATTENDANCE.has(attendanceStatus);
}

export function buildNeutralStreakDates(
  attendanceRows: Array<{ attendance_date: string; status: AttendanceStatus }>,
): Set<string> {
  const neutralDates = new Set<string>();
  for (const row of attendanceRows) {
    if (NEUTRAL_ATTENDANCE.has(row.status)) {
      neutralDates.add(row.attendance_date.slice(0, 10));
    }
  }
  return neutralDates;
}

function breaksGreenStreak(flag: KpiFlag | undefined): boolean {
  return flag === "red" || flag === "yellow";
}

/**
 * Computes the current consecutive green streak ending at `asOfDate`.
 */
export function computeGreenStreak(
  flagByDate: Map<string, KpiFlag>,
  asOfDate: string,
  maxLookback = 400,
  neutralDates: Set<string> = new Set(),
): StreakResult {
  let cursor = asOfDate;
  let length = 0;
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (let i = 0; i < maxLookback; i++) {
    if (isSunday(cursor) || neutralDates.has(cursor)) {
      cursor = previousDay(cursor);
      continue;
    }

    const flag = flagByDate.get(cursor);
    if (flag === "green") {
      if (endDate === null) endDate = cursor;
      startDate = cursor;
      length += 1;
      cursor = previousDay(cursor);
      continue;
    }

    if (breaksGreenStreak(flag)) {
      break;
    }

    break;
  }

  return { length, startDate, endDate };
}

export interface RewardEvaluation {
  eligible: boolean;
  streak: StreakResult;
}

export function evaluateReward(
  streak: StreakResult,
  requiredLength: number,
  hasExistingRewardForStreakEnd: boolean,
): RewardEvaluation {
  return {
    eligible:
      !hasExistingRewardForStreakEnd &&
      streak.length >= requiredLength &&
      streak.startDate !== null,
    streak,
  };
}
