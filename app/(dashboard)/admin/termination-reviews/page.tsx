import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel } from "@/lib/utils/dates";
import { TerminationReviewControls } from "@/components/admin/termination-review-controls";
import { ReviewStatusBadge } from "@/components/warnings/warning-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function AdminTerminationReviewsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: reviewData } = await supabase
    .from("termination_reviews")
    .select("*")
    .order("triggered_at", { ascending: false });

  const reviews = (reviewData ?? []) as Tables<"termination_reviews">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name");
  const nameById = new Map(
    (profileData ?? []).map((p) => [p.id, p.full_name]),
  );

  const openCount = reviews.filter(
    (r) => r.status === "eligible" || r.status === "under_review",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Termination Reviews
        </h1>
        <p className="text-muted-foreground">
          {reviews.length} total · {openCount} open
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
            No termination reviews. These open automatically when an employee
            reaches the warning threshold within the rolling window.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {nameById.get(r.employee_id) ?? "Unknown"}
                    </CardTitle>
                    <CardDescription>
                      Triggered {formatDateLabel(r.triggered_at.slice(0, 10))} ·{" "}
                      {r.warning_ids.length} warnings in window
                    </CardDescription>
                  </div>
                  <ReviewStatusBadge status={r.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.resolution_notes ? (
                  <p className="text-sm text-muted-foreground">
                    Notes: {r.resolution_notes}
                  </p>
                ) : null}
                {r.status !== "resolved" ? (
                  <TerminationReviewControls
                    reviewId={r.id}
                    status={r.status}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Resolved{" "}
                    {r.resolved_at
                      ? formatDateLabel(r.resolved_at.slice(0, 10))
                      : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
