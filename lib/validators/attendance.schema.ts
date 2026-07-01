import { z } from "zod";

import { parseDateString } from "@/lib/utils/dates";

const attendanceStatus = z.enum([
  "present",
  "late",
  "paid_leave",
  "half_day",
  "short_leave",
  "absent",
  "sunday_leave",
]);

const shortLeaveType = z.enum(["late_arrival", "early_departure"]);

export const markAttendanceSchema = z
  .object({
    employee_id: z.string().uuid(),
    attendance_date: z
      .string()
      .refine((v) => parseDateString(v) !== null, "Invalid date."),
    status: attendanceStatus,
    short_leave_type: shortLeaveType.optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) =>
      data.status !== "short_leave" || Boolean(data.short_leave_type),
    {
      message: "Select short leave type (11:30 arrival or 4:30 departure).",
      path: ["short_leave_type"],
    },
  );

export const leaveBalanceSchema = z.object({
  employee_id: z.string().uuid(),
  month: z.string().refine((v) => parseDateString(v) !== null, "Invalid month."),
  paid_leave_allowance: z.coerce.number().min(0).max(31),
  half_day_allowance: z.coerce.number().min(0).max(31),
  short_leave_allowance: z.coerce.number().min(0).max(31),
  late_allowance: z.coerce.number().int().min(0).max(31),
  overtime_hours: z.coerce.number().min(0).max(999).optional(),
});

export const overtimeSchema = z.object({
  employee_id: z.string().uuid(),
  month: z.string().refine((v) => parseDateString(v) !== null, "Invalid month."),
  overtime_hours: z.coerce.number().min(0).max(999),
});

export const payrollSchema = z.object({
  employee_id: z.string().uuid(),
  month: z.string().refine((v) => parseDateString(v) !== null, "Invalid month."),
  incentives: z.coerce.number().min(0).max(9999999),
  conveyance: z.coerce.number().min(0).max(9999999),
  advance_deduction: z.coerce.number().min(0).max(9999999),
  notes: z.string().max(500).optional().nullable(),
});

export const bulkMarkAttendanceSchema = z.object({
  attendance_date: z
    .string()
    .refine((v) => parseDateString(v) !== null, "Invalid date."),
  entries: z
    .array(
      z
        .object({
          employee_id: z.string().uuid(),
          status: attendanceStatus,
          short_leave_type: shortLeaveType.optional().nullable(),
        })
        .refine(
          (data) =>
            data.status !== "short_leave" || Boolean(data.short_leave_type),
          {
            message: "Select short leave type.",
            path: ["short_leave_type"],
          },
        ),
    )
    .min(1, "Select at least one employee."),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type LeaveBalanceInput = z.infer<typeof leaveBalanceSchema>;
export type PayrollInput = z.infer<typeof payrollSchema>;
