import type { AttendanceStatus, KpiFlag } from "@/types/domain";

/**
 * Pure KPI engine. No I/O — deterministic functions over task counts and rules.
 * Mirrors the SQL helpers so client previews and the cron pipeline agree.
 */

export interface KpiRuleThresholds {
  green_threshold: number;
  yellow_threshold: number;
}

export interface DailyKpiInput {
  attendanceStatus?: AttendanceStatus | null;
}

/** Zero daily tasks count as a red flag only on full present days. */
export function attendanceRequiresDailyTasks(
  status: AttendanceStatus | null | undefined,
): boolean {
  return status === "present";
}

/** Completion percentage rounded to 2 decimals. Zero tasks => 0. */
export function calculateCompletionPct(
  totalTasks: number,
  completedTasks: number,
): number {
  if (totalTasks <= 0) return 0;
  const clampedCompleted = Math.max(0, Math.min(completedTasks, totalTasks));
  return Math.round((clampedCompleted / totalTasks) * 10000) / 100;
}

/**
 * Flag rules:
 *  - 0 tasks + present attendance => red
 *  - 0 tasks otherwise          => no_tasks
 *  - pct >= green_threshold      => green
 *  - pct >= yellow_threshold     => yellow
 *  - otherwise                   => red
 */
export function determineKpiFlag(
  completionPct: number,
  totalTasks: number,
  rules: KpiRuleThresholds,
  input?: DailyKpiInput,
): KpiFlag {
  if (totalTasks === 0) {
    return attendanceRequiresDailyTasks(input?.attendanceStatus)
      ? "red"
      : "no_tasks";
  }
  if (completionPct >= rules.green_threshold) return "green";
  if (completionPct >= rules.yellow_threshold) return "yellow";
  return "red";
}

export interface DailyKpiResult {
  totalTasks: number;
  completedTasks: number;
  completionPct: number;
  flag: KpiFlag;
}

export function computeDailyKpi(
  totalTasks: number,
  completedTasks: number,
  rules: KpiRuleThresholds,
  input?: DailyKpiInput,
): DailyKpiResult {
  const completionPct = calculateCompletionPct(totalTasks, completedTasks);
  const flag = determineKpiFlag(completionPct, totalTasks, rules, input);
  return {
    totalTasks,
    completedTasks: Math.max(0, Math.min(completedTasks, totalTasks)),
    completionPct,
    flag,
  };
}
