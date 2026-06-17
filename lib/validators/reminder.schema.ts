import { z } from "zod";

export const createReminderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
  details: z
    .string()
    .trim()
    .max(1000, "Details are too long.")
    .optional()
    .or(z.literal("")),
});

export const reminderIdSchema = z.object({
  id: z.string().uuid("Invalid reminder id."),
});

export const resolveReminderSchema = z.object({
  id: z.string().uuid("Invalid reminder id."),
  note: z
    .string()
    .trim()
    .max(500, "Note is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
