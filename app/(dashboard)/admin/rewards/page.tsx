import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel } from "@/lib/utils/dates";
import { RewardFulfillmentControls } from "@/components/admin/reward-fulfillment-controls";
import { RewardStatusBadge } from "@/components/rewards/reward-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function AdminRewardsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: rewardData } = await supabase
    .from("rewards")
    .select("*")
    .order("eligible_at", { ascending: false });

  const rewards = (rewardData ?? []) as Tables<"rewards">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name");
  const nameById = new Map(
    (profileData ?? []).map((p) => [p.id, p.full_name]),
  );

  const pending = rewards.filter((r) => r.status === "eligible");
  const resolved = rewards.filter((r) => r.status !== "eligible");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          {pending.length} awaiting fulfillment · {rewards.length} total
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Awaiting fulfillment
        </h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
              No rewards pending. Eligible rewards appear here automatically.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {nameById.get(r.employee_id) ?? "Unknown"}
                      </CardTitle>
                      <CardDescription>
                        {formatDateLabel(r.streak_start_date)} –{" "}
                        {formatDateLabel(r.streak_end_date)}
                      </CardDescription>
                    </div>
                    <RewardStatusBadge status={r.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <RewardFulfillmentControls rewardId={r.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            History
          </h2>
          <div className="space-y-3">
            {resolved.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {nameById.get(r.employee_id) ?? "Unknown"}
                      </CardTitle>
                      <CardDescription>
                        {formatDateLabel(r.streak_start_date)} –{" "}
                        {formatDateLabel(r.streak_end_date)}
                        {r.notes ? ` · ${r.notes}` : ""}
                      </CardDescription>
                    </div>
                    <RewardStatusBadge status={r.status} />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
