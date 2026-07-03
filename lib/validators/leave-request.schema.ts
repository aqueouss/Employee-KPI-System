import { z } from "zod";

import { parseDateString } from "@/lib/utils/dates";

const leaveRequestType = z.enum(["paid_leave", "half_day", "short_leave"]);
const shortLeaveType = z.enum(["late_arrival", "early_departure"]);

export const createLeaveRequestSchema = z
  .object({
    leave_date: z
      .string()
      .refine((v) => parseDateString(v) !== null, "Invalid date."),
    leave_type: leaveRequestType,
    short_leave_type: shortLeaveType.optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) =>
      data.leave_type !== "short_leave" || Boolean(data.short_leave_type),
    {
      message: "Select short leave type (11:30 arrival or 4:30 departure).",
      path: ["short_leave_type"],
    },
  );

export const reviewLeaveRequestSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional().nullable(),
});

export const leaveRequestIdSchema = z.object({
  id: z.string().uuid(),
});
