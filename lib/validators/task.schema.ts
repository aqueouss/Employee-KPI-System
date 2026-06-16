import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format.");

export const taskPeriodEnum = z.enum([
  "daily",
  "weekly",
  "monthly",
  "quarterly",
]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Task title is too long."),
  task_date: dateString,
  period: taskPeriodEnum.default("daily"),
});

export const updateTaskSchema = z.object({
  id: z.string().uuid("Invalid task id."),
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Task title is too long."),
});

export const toggleTaskSchema = z.object({
  id: z.string().uuid("Invalid task id."),
  completed: z.boolean(),
});

export const deleteTaskSchema = z.object({
  id: z.string().uuid("Invalid task id."),
});

export const reviewTaskSchema = z.object({
  id: z.string().uuid("Invalid task id."),
  decision: z.enum(["approve", "reject"]),
  note: z
    .string()
    .trim()
    .max(500, "Note is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;
