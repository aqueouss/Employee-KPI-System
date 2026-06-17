"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils/dates";
import {
  createSuggestionSchema,
  MAX_SUGGESTIONS,
  suggestionIdSchema,
  updateSuggestionSchema,
} from "@/lib/validators/suggestion.schema";

export type SuggestionActionState = {
  error?: string;
  success?: boolean;
};

function revalidate() {
  revalidatePath("/employee");
}

export async function createSuggestionAction(
  _prevState: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = createSuggestionSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("task_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", profile.id);

  if ((count ?? 0) >= MAX_SUGGESTIONS) {
    return { error: `You can only save up to ${MAX_SUGGESTIONS} suggestions.` };
  }

  const { error } = await supabase.from("task_suggestions").insert({
    employee_id: profile.id,
    title: parsed.data.title,
  });
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function updateSuggestionAction(
  _prevState: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = updateSuggestionSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_suggestions")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.id)
    .eq("employee_id", profile.id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function deleteSuggestionAction(
  _prevState: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = suggestionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_suggestions")
    .delete()
    .eq("id", parsed.data.id)
    .eq("employee_id", profile.id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

/** One-click: add a saved suggestion to today's daily task list. */
export async function addSuggestionToTodayAction(
  _prevState: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = suggestionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: suggestion, error: fetchError } = await supabase
    .from("task_suggestions")
    .select("title, employee_id")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !suggestion) return { error: "Suggestion not found." };
  if (suggestion.employee_id !== profile.id) return { error: "Forbidden." };

  const { error } = await supabase.from("tasks").insert({
    employee_id: profile.id,
    title: suggestion.title,
    task_date: getTodayDateString(),
    period: "daily",
  });
  if (error) return { error: error.message };

  revalidatePath("/employee");
  revalidatePath("/employee/tasks");
  return { success: true };
}
