import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";
import type { KpiFlag } from "@/types/domain";
import { computeGreenStreak, evaluateReward } from "./reward.engine";

type Client = SupabaseClient<Database>;

/**
 * Evaluates an employee's green streak ending at `date` and (idempotently)
 * creates a reward eligibility row when the streak reaches the configured
 * length. Requires a service-role client. Returns the reward or null.
 */
export async function evaluateAndCreateReward(
  client: Client,
  employeeId: string,
  date: string,
  rules: Tables<"kpi_rules">,
): Promise<Tables<"rewards"> | null> {
  const required = rules.green_streak_for_reward;

  // Load a window of snapshots large enough to cover the streak requirement
  // plus Sunday skips. 2x + buffer is plenty.
  const lookbackDays = required * 2 + 30;
  const windowStart = (() => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - lookbackDays);
    return d.toISOString().slice(0, 10);
  })();

  const { data: snapshots, error } = await client
    .from("daily_kpi_snapshots")
    .select("kpi_date, flag")
    .eq("employee_id", employeeId)
    .gte("kpi_date", windowStart)
    .lte("kpi_date", date);

  if (error) throw new Error(`Failed to load snapshots: ${error.message}`);

  const flagByDate = new Map<string, KpiFlag>(
    (snapshots ?? []).map((s) => [s.kpi_date, s.flag]),
  );

  const streak = computeGreenStreak(
    flagByDate,
    date,
    lookbackDays + 5,
  );

  if (streak.startDate === null || streak.endDate === null) return null;

  // Idempotency: skip if a reward already exists whose streak overlaps this end.
  const { data: existing } = await client
    .from("rewards")
    .select("id")
    .eq("employee_id", employeeId)
    .gte("streak_end_date", streak.startDate)
    .lte("streak_end_date", streak.endDate)
    .limit(1)
    .maybeSingle();

  const evaluation = evaluateReward(streak, required, Boolean(existing));
  if (!evaluation.eligible) return null;

  const { data: inserted, error: insertError } = await client
    .from("rewards")
    .insert({
      employee_id: employeeId,
      streak_start_date: streak.startDate,
      streak_end_date: streak.endDate,
      status: "eligible",
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Failed to create reward: ${insertError.message}`);
  }

  return inserted;
}
