import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";
import { getTodayDateString, addDaysToDateString } from "@/lib/utils/dates";
import {
  evaluateAndIssueWarning,
  evaluateAndOpenTerminationReview,
} from "@/services/warnings/warning.service";
import { evaluateAndCreateReward } from "@/services/rewards/reward.service";
import { computeDailyKpi, type DailyKpiResult } from "./kpi.engine";

type Client = SupabaseClient<Database>;

/** Loads the singleton KPI rules row (id = 1). */
export async function getKpiRules(client: Client): Promise<Tables<"kpi_rules">> {
  const { data, error } = await client
    .from("kpi_rules")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load KPI rules: ${error?.message ?? "missing"}`);
  }
  return data;
}

/**
 * Computes and upserts a single employee's daily KPI snapshot.
 * Idempotent via the (employee_id, kpi_date) unique constraint.
 * Requires a client that can write snapshots (service role).
 */
export async function upsertDailySnapshot(
  client: Client,
  employeeId: string,
  date: string,
  rules: Tables<"kpi_rules">,
): Promise<DailyKpiResult> {
  const { data: tasks, error } = await client
    .from("tasks")
    .select("status")
    .eq("employee_id", employeeId)
    .eq("task_date", date)
    .eq("period", "daily");

  if (error) {
    throw new Error(`Failed to load tasks: ${error.message}`);
  }

  const total = tasks?.length ?? 0;
  const completed =
    tasks?.filter((t) => t.status === "completed").length ?? 0;

  const result = computeDailyKpi(total, completed, rules);

  const { error: upsertError } = await client
    .from("daily_kpi_snapshots")
    .upsert(
      {
        employee_id: employeeId,
        kpi_date: date,
        total_tasks: result.totalTasks,
        completed_tasks: result.completedTasks,
        completion_pct: result.completionPct,
        flag: result.flag,
        rules_version: rules.version,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,kpi_date" },
    );

  if (upsertError) {
    throw new Error(`Failed to upsert snapshot: ${upsertError.message}`);
  }

  return result;
}

export interface DailyPipelineSummary {
  kpiDate: string;
  processed: number;
  flags: Record<string, number>;
  warningsIssued: number;
  terminationReviewsOpened: number;
  rewardsCreated: number;
}

/**
 * Runs the daily KPI snapshot pipeline for all active employees.
 * Pass a service-role client. Date defaults to "yesterday" in company timezone.
 */
export async function runDailyKpiPipeline(
  client: Client,
  date?: string,
): Promise<DailyPipelineSummary> {
  const rules = await getKpiRules(client);
  const kpiDate =
    date ?? addDaysToDateString(getTodayDateString(rules.company_timezone), -1);

  const { data: employees, error } = await client
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .eq("kpi_tracked", true);

  if (error) {
    throw new Error(`Failed to load employees: ${error.message}`);
  }

  const flags: Record<string, number> = {
    green: 0,
    yellow: 0,
    red: 0,
    no_tasks: 0,
  };
  let warningsIssued = 0;
  let terminationReviewsOpened = 0;
  let rewardsCreated = 0;

  for (const employee of employees ?? []) {
    const result = await upsertDailySnapshot(
      client,
      employee.id,
      kpiDate,
      rules,
    );
    flags[result.flag] = (flags[result.flag] ?? 0) + 1;

    // Warning + termination engines run after the snapshot is persisted.
    const warning = await evaluateAndIssueWarning(
      client,
      employee.id,
      kpiDate,
      rules,
    );
    if (warning) {
      warningsIssued += 1;
      const review = await evaluateAndOpenTerminationReview(
        client,
        employee.id,
        kpiDate,
        rules,
      );
      if (review) terminationReviewsOpened += 1;
    }

    // Reward engine: only worth checking when today's flag is green.
    if (result.flag === "green") {
      const reward = await evaluateAndCreateReward(
        client,
        employee.id,
        kpiDate,
        rules,
      );
      if (reward) rewardsCreated += 1;
    }
  }

  return {
    kpiDate,
    processed: employees?.length ?? 0,
    flags,
    warningsIssued,
    terminationReviewsOpened,
    rewardsCreated,
  };
}
