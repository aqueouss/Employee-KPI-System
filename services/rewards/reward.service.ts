import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";
import type { AttendanceStatus, KpiFlag } from "@/types/domain";
import {
  buildNeutralStreakDates,
  computeGreenStreak,
  evaluateReward,
} from "./reward.engine";

type Client = SupabaseClient<Database>;

export async function loadRewardStreakContext(
  client: Client,
  employeeId: string,
  date: string,
  requiredLength: number,
) {
  const lookbackDays = requiredLength * 2 + 30;
  const windowStart = (() => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - lookbackDays);
    return d.toISOString().slice(0, 10);
  })();

  const [{ data: snapshots, error }, { data: attendance, error: attendanceError }] =
    await Promise.all([
      client
        .from("daily_kpi_snapshots")
        .select("kpi_date, flag")
        .eq("employee_id", employeeId)
        .gte("kpi_date", windowStart)
        .lte("kpi_date", date),
      client
        .from("attendance_records")
        .select("attendance_date, status")
        .eq("employee_id", employeeId)
        .gte("attendance_date", windowStart)
        .lte("attendance_date", date),
    ]);

  if (error) throw new Error(`Failed to load snapshots: ${error.message}`);
  if (attendanceError) {
    throw new Error(`Failed to load attendance: ${attendanceError.message}`);
  }

  const flagByDate = new Map<string, KpiFlag>(
    (snapshots ?? []).map((row) => [row.kpi_date, row.flag]),
  );
  const neutralDates = buildNeutralStreakDates(
    (attendance ?? []).map((row) => ({
      attendance_date: row.attendance_date,
      status: row.status as AttendanceStatus,
    })),
  );

  return {
    flagByDate,
    neutralDates,
    lookbackDays,
  };
}

export async function evaluateAndCreateReward(
  client: Client,
  employeeId: string,
  date: string,
  rules: Tables<"kpi_rules">,
): Promise<Tables<"rewards"> | null> {
  const required = rules.green_streak_for_reward;
  const { flagByDate, neutralDates, lookbackDays } = await loadRewardStreakContext(
    client,
    employeeId,
    date,
    required,
  );

  const streak = computeGreenStreak(
    flagByDate,
    date,
    lookbackDays + 5,
    neutralDates,
  );

  if (streak.startDate === null || streak.endDate === null) return null;

  const { data: existing } = await client
    .from("rewards")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("streak_end_date", streak.endDate)
    .in("status", ["eligible", "issued"])
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
