import { z } from "zod";

import { isValidTimezone } from "@/lib/utils/dates";

export const kpiRulesSchema = z
  .object({
    green_threshold: z.coerce
      .number()
      .min(1, "Green threshold must be at least 1.")
      .max(100, "Green threshold cannot exceed 100."),
    yellow_threshold: z.coerce
      .number()
      .min(1, "Yellow threshold must be at least 1.")
      .max(100, "Yellow threshold cannot exceed 100."),
    red_flags_for_warning: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1."),
    warnings_for_termination: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1."),
    termination_window_days: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1 day."),
    green_streak_for_reward: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1 day."),
    count_weekends: z.coerce.boolean(),
    company_timezone: z
      .string()
      .min(1, "Timezone is required.")
      .refine(isValidTimezone, {
        message: "Enter a valid IANA timezone, e.g. Asia/Kolkata.",
      }),
  })
  .refine((data) => data.green_threshold > data.yellow_threshold, {
    message: "Green threshold must be greater than the yellow threshold.",
    path: ["green_threshold"],
  });

export type KpiRulesInput = z.infer<typeof kpiRulesSchema>;
