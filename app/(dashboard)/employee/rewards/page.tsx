import { Award } from "lucide-react";

import { requireKpiEmployee } from "@/lib/auth/require-kpi-employee";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, formatDateLabel } from "@/lib/utils/dates";
import { computeGreenStreak } from "@/services/rewards/reward.engine";
import { RewardStatusBadge } from "@/components/rewards/reward-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";
import type { KpiFlag } from "@/types/domain";

export default async function EmployeeRewardsPage() {
  const profile = await requireKpiEmployee();
  const today = getTodayDateString();
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("kpi_rules")
    .select("green_streak_for_reward")
    .eq("id", 1)
    .single();

  const required = rules?.green_streak_for_reward ?? 30;

  // Current finalized streak (snapshots up to yesterday typically).
  const { data: snapshots } = await supabase
    .from("daily_kpi_snapshots")
    .select("kpi_date, flag")
    .eq("employee_id", profile.id)
    .order("kpi_date", { ascending: false })
    .limit(required * 2 + 30);

  const flagByDate = new Map<string, KpiFlag>(
    (snapshots ?? []).map((s) => [s.kpi_date, s.flag]),
  );
  // Evaluate streak ending at the most recent finalized snapshot date.
  const latestDate = snapshots?.[0]?.kpi_date ?? today;
  const streak = computeGreenStreak(flagByDate, latestDate);
  const progress = Math.min(100, Math.round((streak.length / required) * 100));

  const { data: rewardData } = await supabase
    .from("rewards")
    .select("*")
    .eq("employee_id", profile.id)
    .order("eligible_at", { ascending: false });

  const rewards = (rewardData ?? []) as Tables<"rewards">[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          Earn a reward with {required} consecutive green-flag days (Sundays
          excluded).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Current green streak</CardDescription>
          <CardTitle className="text-3xl">
            {streak.length}
            <span className="text-lg text-muted-foreground"> / {required}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {streak.length >= required
              ? "Eligible! Awaiting admin fulfillment."
              : `${required - streak.length} more green days to go.`}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Reward history
        </h2>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <p className="font-medium">No rewards yet</p>
              <p className="text-sm text-muted-foreground">
                Keep your streak going to become eligible.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rewards.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {required}-day green streak
                      </CardTitle>
                      <CardDescription>
                        {formatDateLabel(r.streak_start_date)} –{" "}
                        {formatDateLabel(r.streak_end_date)}
                      </CardDescription>
                    </div>
                    <RewardStatusBadge status={r.status} />
                  </div>
                </CardHeader>
                {r.notes ? (
                  <CardContent className="text-sm text-muted-foreground">
                    {r.notes}
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
