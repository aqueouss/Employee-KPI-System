import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";
import { addDaysToDateString } from "@/lib/utils/dates";
import { loadMonthlyWeeklyRedFlagDates } from "@/services/kpi/weekly.service";
import {
  evaluateTerminationReview,
  monthKeyForDate,
  reconcileMonthlyWarningState,
  terminationWindowStart,
} from "./warning.engine";

type Client = SupabaseClient<Database>;

export interface MonthlyWarningReconciliation {
  issued: Tables<"warnings"> | null;
  revoked: boolean;
}

async function loadMonthlyRedFlagDates(
  client: Client,
  employeeId: string,
  date: string,
  asOfDate: string = date,
): Promise<{ monthKey: string; redFlagDates: string[] }> {
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

  const dailyRedFlagDates = (redSnapshots ?? []).map((s) => s.kpi_date);
  const weeklyRedFlagDates = await loadMonthlyWeeklyRedFlagDates(
    client,
    employeeId,
    date,
    asOfDate,
  );

  return {
    monthKey,
    redFlagDates: [...dailyRedFlagDates, ...weeklyRedFlagDates].sort(),
  };
}

/**
 * Reconciles a monthly warning for an employee based on current red-flag
 * snapshots in the calendar month containing `date`. Issues, updates, or
 * revokes active warnings as needed.
 */
export async function reconcileMonthlyWarning(
  client: Client,
  employeeId: string,
  date: string,
  rules: Tables<"kpi_rules">,
  asOfDate?: string,
): Promise<MonthlyWarningReconciliation> {
  const effectiveAsOf = asOfDate ?? date;
  const { monthKey, redFlagDates } = await loadMonthlyRedFlagDates(
    client,
    employeeId,
    date,
    effectiveAsOf,
  );

  const { data: existing } = await client
    .from("warnings")
    .select("id, status")
    .eq("employee_id", employeeId)
    .eq("warning_month", monthKey)
    .maybeSingle();

  const evaluation = reconcileMonthlyWarningState(
    redFlagDates,
    rules.red_flags_for_warning,
    existing ? { status: existing.status } : null,
  );

  if (evaluation.shouldRevoke && existing) {
    const { error: deleteError } = await client
      .from("warnings")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      throw new Error(`Failed to revoke warning: ${deleteError.message}`);
    }

    await reconcileTerminationReviewAfterWarningChange(
      client,
      employeeId,
      date,
      rules,
    );

    return { issued: null, revoked: true };
  }

  if (evaluation.shouldIssue) {
    const { data: inserted, error: insertError } = await client
      .from("warnings")
      .insert({
        employee_id: employeeId,
        warning_month: monthKey,
        red_flag_dates: evaluation.redFlagDates,
        reason: `${evaluation.redFlagCount} red KPI flags in ${monthKey.slice(0, 7)} (daily + weekly).`,
      })
      .select("*")
      .single();

    if (insertError) {
      // Unique violation => another process issued it; treat as no-op.
      if (insertError.code === "23505") return { issued: null, revoked: false };
      throw new Error(`Failed to insert warning: ${insertError.message}`);
    }

    return { issued: inserted, revoked: false };
  }

  if (evaluation.shouldUpdate && existing) {
    const { error: updateError } = await client
      .from("warnings")
      .update({
        red_flag_dates: evaluation.redFlagDates,
        reason: `${evaluation.redFlagCount} red KPI flags in ${monthKey.slice(0, 7)} (daily + weekly).`,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(`Failed to update warning: ${updateError.message}`);
    }
  }

  return { issued: null, revoked: false };
}

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
  const result = await reconcileMonthlyWarning(client, employeeId, date, rules);
  return result.issued;
}

/**
 * Closes auto-opened termination reviews when warnings no longer meet the
 * threshold (e.g. after late task approvals revoke a warning).
 */
export async function reconcileTerminationReviewAfterWarningChange(
  client: Client,
  employeeId: string,
  asOfDate: string,
  rules: Tables<"kpi_rules">,
): Promise<void> {
  const windowStart = terminationWindowStart(
    asOfDate,
    rules.termination_window_days,
  );

  const { data: warnings, error } = await client
    .from("warnings")
    .select("id")
    .eq("employee_id", employeeId)
    .gte("issued_at", `${windowStart}T00:00:00Z`);

  if (error) throw new Error(`Failed to load warnings: ${error.message}`);

  if ((warnings ?? []).length >= rules.warnings_for_termination) return;

  const { data: openReviews, error: reviewError } = await client
    .from("termination_reviews")
    .select("id, status")
    .eq("employee_id", employeeId)
    .in("status", ["eligible", "under_review"]);

  if (reviewError) {
    throw new Error(`Failed to load termination reviews: ${reviewError.message}`);
  }

  const eligibleReview = (openReviews ?? []).find(
    (review) => review.status === "eligible",
  );
  if (!eligibleReview) return;

  const { error: deleteError } = await client
    .from("termination_reviews")
    .delete()
    .eq("id", eligibleReview.id);

  if (deleteError) {
    throw new Error(
      `Failed to close termination review: ${deleteError.message}`,
    );
  }

  const hasUnderReview = (openReviews ?? []).some(
    (review) => review.status === "under_review",
  );
  if (!hasUnderReview) {
    await client
      .from("profiles")
      .update({ termination_review_status: "none" })
      .eq("id", employeeId)
      .eq("termination_review_status", "eligible");
  }
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
