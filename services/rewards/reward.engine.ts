import type { KpiFlag } from "@/types/domain";

/**
 * Pure reward streak engine. No I/O.
 *
 * Rule: N consecutive green-flag days ending at `asOfDate` => reward eligible.
 * Non-green days (yellow/red/no_tasks) break the streak. A missing snapshot for
 * a counted day also breaks it. Sundays are always skipped (office closed).
 */

export interface StreakResult {
  length: number;
  startDate: string | null;
  endDate: string | null;
}

function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

/**
 * Computes the current consecutive green streak ending at `asOfDate`.
 * @param flagByDate  map of YYYY-MM-DD => flag for finalized snapshots
 * @param asOfDate    the day to evaluate the streak up to (inclusive)
 * @param maxLookback safety bound on days walked backward (default 400)
 */
export function computeGreenStreak(
  flagByDate: Map<string, KpiFlag>,
  asOfDate: string,
  maxLookback = 400,
): StreakResult {
  let cursor = asOfDate;
  let length = 0;
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (let i = 0; i < maxLookback; i++) {
    if (isSunday(cursor)) {
      cursor = previousDay(cursor);
      continue;
    }

    const flag = flagByDate.get(cursor);
    if (flag === "green") {
      if (endDate === null) endDate = cursor;
      startDate = cursor;
      length += 1;
      cursor = previousDay(cursor);
    } else {
      break;
    }
  }

  return { length, startDate, endDate };
}

export interface RewardEvaluation {
  eligible: boolean;
  streak: StreakResult;
}

/**
 * Decides whether a reward is due.
 * @param hasOverlappingReward whether an existing reward already covers this streak end
 */
export function evaluateReward(
  streak: StreakResult,
  requiredLength: number,
  hasOverlappingReward: boolean,
): RewardEvaluation {
  return {
    eligible:
      !hasOverlappingReward &&
      streak.length >= requiredLength &&
      streak.startDate !== null,
    streak,
  };
}
