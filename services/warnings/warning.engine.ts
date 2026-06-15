/**
 * Pure warning + termination-review logic. No I/O.
 *
 * Warning rule:    >= N red flags in a calendar month => 1 warning (idempotent).
 * Termination rule: >= M warnings within a rolling window => review eligible.
 */

/** First day of the calendar month for a YYYY-MM-DD date, as YYYY-MM-01. */
export function monthKeyForDate(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export interface WarningEvaluation {
  shouldIssue: boolean;
  redFlagDates: string[];
  redFlagCount: number;
}

/**
 * Decide whether a warning is due for a month.
 * @param redFlagDates  all red-flag dates within the month
 * @param threshold     red flags required (default 3)
 * @param hasExistingWarning  whether a warning already exists for this month
 */
export function evaluateMonthlyWarning(
  redFlagDates: string[],
  threshold: number,
  hasExistingWarning: boolean,
): WarningEvaluation {
  const sorted = [...redFlagDates].sort();
  return {
    shouldIssue: !hasExistingWarning && sorted.length >= threshold,
    redFlagDates: sorted,
    redFlagCount: sorted.length,
  };
}

/** Inclusive lower bound (YYYY-MM-DD) of the rolling termination window. */
export function terminationWindowStart(
  asOfDate: string,
  windowDays: number,
): string {
  const d = new Date(`${asOfDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (windowDays - 1));
  return d.toISOString().slice(0, 10);
}

export interface TerminationEvaluation {
  shouldFlag: boolean;
  warningCount: number;
}

/**
 * Decide whether a termination review should be opened.
 * @param warningDatesInWindow  issued-at dates already filtered to the window
 * @param threshold             warnings required (default 3)
 * @param hasOpenReview         whether the employee already has an open/eligible review
 */
export function evaluateTerminationReview(
  warningDatesInWindow: string[],
  threshold: number,
  hasOpenReview: boolean,
): TerminationEvaluation {
  const count = warningDatesInWindow.length;
  return {
    shouldFlag: !hasOpenReview && count >= threshold,
    warningCount: count,
  };
}
