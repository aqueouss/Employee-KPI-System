import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";
import { addDaysToDateString } from "@/lib/utils/dates";
import {
  evaluateMonthlyWarning,
  evaluateTerminationReview,
  monthKeyForDate,
  terminationWindowStart,
} from "./warning.engine";

type Client = SupabaseClient<Database>;

/**
 * Evaluates and (idempotently) issues a monthly warning for an employee based
 * on red-flag snapshots in the calendar month containing `date`.
 * Requires a service-role client. Returns the issued warning or null.
 */
export async function evaluateAndIssueWarning(
  client: Client,
  employeeId: string,
  date: string,
  rules: Tables<"kpi_rules">,
): Promise<Tables<"warnings"> | null> {
  const monthKey = monthKeyForDate(date);
  const monthStart = monthKey;
  const monthEnd = addDaysToDateString(
    `${date.slice(0, 7)}-01`,
    daysInMonth(date),
  );

  const { data: redSnapshots, error } = await client
    .from("daily_kpi_snapshots")
    .select("kpi_date")
    .eq("employee_id", employeeId)
    .eq("flag", "red")
    .gte("kpi_date", monthStart)
    .lt("kpi_date", monthEnd);

  if (error) throw new Error(`Failed to load red snapshots: ${error.message}`);

  const { data: existing } = await client
    .from("warnings")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("warning_month", monthKey)
    .maybeSingle();

  const evaluation = evaluateMonthlyWarning(
    (redSnapshots ?? []).map((s) => s.kpi_date),
    rules.red_flags_for_warning,
    Boolean(existing),
  );

  if (!evaluation.shouldIssue) return null;

  const { data: inserted, error: insertError } = await client
    .from("warnings")
    .insert({
      employee_id: employeeId,
      warning_month: monthKey,
      red_flag_dates: evaluation.redFlagDates,
      reason: `${evaluation.redFlagCount} red KPI flags in ${monthKey.slice(0, 7)}.`,
    })
    .select("*")
    .single();

  if (insertError) {
    // Unique violation => another process issued it; treat as no-op.
    if (insertError.code === "23505") return null;
    throw new Error(`Failed to insert warning: ${insertError.message}`);
  }

  return inserted;
}

/**
 * Evaluates whether an employee crosses the termination-review threshold within
 * the rolling window and, if so, opens a review and flags the profile.
 * Requires a service-role client. Returns the created review or null.
 */
export async function evaluateAndOpenTerminationReview(
  client: Client,
  employeeId: string,
  asOfDate: string,
  rules: Tables<"kpi_rules">,
): Promise<Tables<"termination_reviews"> | null> {
  const windowStart = terminationWindowStart(
    asOfDate,
    rules.termination_window_days,
  );

  const { data: warnings, error } = await client
    .from("warnings")
    .select("id, issued_at")
    .eq("employee_id", employeeId)
    .gte("issued_at", `${windowStart}T00:00:00Z`);

  if (error) throw new Error(`Failed to load warnings: ${error.message}`);

  const { data: openReview } = await client
    .from("termination_reviews")
    .select("id")
    .eq("employee_id", employeeId)
    .in("status", ["eligible", "under_review"])
    .maybeSingle();

  const evaluation = evaluateTerminationReview(
    (warnings ?? []).map((w) => w.issued_at),
    rules.warnings_for_termination,
    Boolean(openReview),
  );

  if (!evaluation.shouldFlag) return null;

  const { data: inserted, error: insertError } = await client
    .from("termination_reviews")
    .insert({
      employee_id: employeeId,
      warning_ids: (warnings ?? []).map((w) => w.id),
      status: "eligible",
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Failed to open termination review: ${insertError.message}`);
  }

  await client
    .from("profiles")
    .update({ termination_review_status: "eligible" })
    .eq("id", employeeId);

  return inserted;
}

function daysInMonth(date: string): number {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
