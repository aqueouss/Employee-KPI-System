"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const profile = await getSessionProfile();

  if (!profile) {
    return { error: "Not authenticated." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Full name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", profile.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}
