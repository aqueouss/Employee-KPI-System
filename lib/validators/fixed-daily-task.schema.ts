import { z } from "zod";

export const MAX_FIXED_DAILY_TASKS = 5;

export const createFixedDailyTaskSchema = z.object({
  employee_id: z.string().uuid("Invalid employee id."),
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Task title is too long."),
});

export const updateFixedDailyTaskSchema = z.object({
  id: z.string().uuid("Invalid task id."),
  employee_id: z.string().uuid("Invalid employee id."),
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Task title is too long."),
});

export const fixedDailyTaskIdSchema = z.object({
  id: z.string().uuid("Invalid task id."),
  employee_id: z.string().uuid("Invalid employee id."),
});
