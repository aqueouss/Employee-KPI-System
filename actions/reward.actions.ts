"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";

export type RewardActionState = {
  error?: string;
  success?: boolean;
};

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

export async function updateRewardStatusAction(
  rewardId: string,
  status: "issued" | "declined",
  notes?: string,
): Promise<RewardActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden. Admin access required." };

  if (status !== "issued" && status !== "declined") {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rewards")
    .update({
      status,
      issued_at: status === "issued" ? new Date().toISOString() : null,
      issued_by: admin.id,
      notes: notes ?? null,
    })
    .eq("id", rewardId);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: status === "issued" ? "reward.issued" : "reward.declined",
    entity_type: "reward",
    entity_id: rewardId,
    metadata: {},
  });

  revalidatePath("/admin/rewards");
  return { success: true };
}
