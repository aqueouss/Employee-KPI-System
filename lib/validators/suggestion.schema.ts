import { z } from "zod";

export const MAX_SUGGESTIONS = 5;

export const createSuggestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Suggestion title is required.")
    .max(200, "Suggestion title is too long."),
});

export const updateSuggestionSchema = z.object({
  id: z.string().uuid("Invalid suggestion id."),
  title: z
    .string()
    .trim()
    .min(1, "Suggestion title is required.")
    .max(200, "Suggestion title is too long."),
});

export const suggestionIdSchema = z.object({
  id: z.string().uuid("Invalid suggestion id."),
});

export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>;
export type UpdateSuggestionInput = z.infer<typeof updateSuggestionSchema>;
