"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import type { ReviewStatus } from "@/types/domain";

export type WarningActionState = {
  error?: string;
  success?: boolean;
};

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

export async function acknowledgeWarningAction(
  warningId: string,
): Promise<WarningActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden. Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("warnings")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: admin.id,
    })
    .eq("id", warningId);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "warning.acknowledged",
    entity_type: "warning",
    entity_id: warningId,
    metadata: {},
  });

  revalidatePath("/admin/warnings");
  return { success: true };
}

export async function updateTerminationReviewAction(
  reviewId: string,
  status: ReviewStatus,
  notes?: string,
): Promise<WarningActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden. Admin access required." };

  if (!["eligible", "under_review", "resolved"].includes(status)) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();

  const { data: review, error: fetchError } = await supabase
    .from("termination_reviews")
    .select("employee_id")
    .eq("id", reviewId)
    .single();

  if (fetchError || !review) return { error: "Review not found." };

  const isResolved = status === "resolved";
  const { error } = await supabase
    .from("termination_reviews")
    .update({
      status,
      resolution_notes: notes ?? null,
      resolved_at: isResolved ? new Date().toISOString() : null,
      resolved_by: isResolved ? admin.id : null,
    })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  // Keep the employee's profile status in sync with the review.
  await supabase
    .from("profiles")
    .update({
      termination_review_status: isResolved ? "resolved" : status,
    })
    .eq("id", review.employee_id);

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "termination_review.updated",
    entity_type: "termination_review",
    entity_id: reviewId,
    metadata: { status },
  });

  revalidatePath("/admin/termination-reviews");
  revalidatePath("/admin/employees");
  return { success: true };
}
