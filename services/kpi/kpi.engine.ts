import type { KpiFlag } from "@/types/domain";

/**
 * Pure KPI engine. No I/O — deterministic functions over task counts and rules.
 * Mirrors the SQL helpers so client previews and the cron pipeline agree.
 */

export interface KpiRuleThresholds {
  green_threshold: number;
  yellow_threshold: number;
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
 *  - 0 tasks                     => no_tasks
 *  - pct >= green_threshold      => green
 *  - pct >= yellow_threshold     => yellow
 *  - otherwise                   => red
 */
export function determineKpiFlag(
  completionPct: number,
  totalTasks: number,
  rules: KpiRuleThresholds,
): KpiFlag {
  if (totalTasks === 0) return "no_tasks";
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
): DailyKpiResult {
  const completionPct = calculateCompletionPct(totalTasks, completedTasks);
  const flag = determineKpiFlag(completionPct, totalTasks, rules);
  return {
    totalTasks,
    completedTasks: Math.max(0, Math.min(completedTasks, totalTasks)),
    completionPct,
    flag,
  };
}
