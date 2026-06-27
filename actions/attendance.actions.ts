"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import {
  leaveBalanceSchema,
  markAttendanceSchema,
  overtimeSchema,
} from "@/lib/validators/attendance.schema";
import { loadMonthAttendance } from "@/lib/attendance/month-data";
import {
  applyWeeklySundayRules,
  currentMonthStart,
  type AttendanceRecordInput,
} from "@/services/attendance/attendance.engine";
import { startOfMonthDateString, endOfMonthDateString, normalizeDateString } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

export type AttendanceActionState = {
  error?: string;
  success?: string;
};

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

function toRecordInput(row: Tables<"attendance_records">): AttendanceRecordInput {
  return {
    attendance_date: normalizeDateString(row.attendance_date),
    status: row.status,
    short_leave_type: row.short_leave_type,
    is_auto_generated: row.is_auto_generated,
  };
}

async function loadEmployeeRecords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  monthStart: string,
) {
  const padStart = addDays(monthStart, -7);
  const monthEnd = endOfMonthDateString(monthStart);
  const padEnd = addDays(monthEnd, 14);

  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("attendance_date", padStart)
    .lte("attendance_date", padEnd);

  if (error) throw new Error(error.message);
  return (data ?? []) as Tables<"attendance_records">[];
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function syncAutoSundayLeaves(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  adminId: string,
  rows: Tables<"attendance_records">[],
) {
  const inputs = rows.map(toRecordInput);
  const merged = applyWeeklySundayRules(inputs);
  const autoRows = merged.filter((r) => r.is_auto_generated);

  for (const auto of autoRows) {
    const existing = rows.find(
      (r) => normalizeDateString(r.attendance_date) === auto.attendance_date,
    );
    if (existing) {
      if (
        existing.is_auto_generated &&
        existing.status !== auto.status
      ) {
        await supabase
          .from("attendance_records")
          .update({ status: auto.status, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
      continue;
    }
    await supabase.from("attendance_records").insert({
      employee_id: employeeId,
      attendance_date: auto.attendance_date,
      status: auto.status,
      is_auto_generated: true,
      marked_by: adminId,
    });
  }

  const requiredDates = new Set(
    autoRows.map((r) => normalizeDateString(r.attendance_date)),
  );
  for (const row of rows) {
    if (
      row.is_auto_generated &&
      (row.status === "sunday_leave" ||
        (row.status === "absent" && isSundayDate(row.attendance_date))) &&
      !requiredDates.has(normalizeDateString(row.attendance_date))
    ) {
      await supabase.from("attendance_records").delete().eq("id", row.id);
    }
  }
}

function isSundayDate(date: string): boolean {
  return new Date(`${normalizeDateString(date)}T00:00:00Z`).getUTCDay() === 0;
}

export async function markAttendanceAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const parsed = markAttendanceSchema.safeParse({
    employee_id: formData.get("employee_id"),
    attendance_date: formData.get("attendance_date"),
    status: formData.get("status"),
    short_leave_type: formData.get("short_leave_type") || null,
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const monthStart = startOfMonthDateString(parsed.data.attendance_date);

  const { error } = await supabase.from("attendance_records").upsert(
    {
      employee_id: parsed.data.employee_id,
      attendance_date: normalizeDateString(parsed.data.attendance_date),
      status: parsed.data.status,
      short_leave_type:
        parsed.data.status === "short_leave"
          ? parsed.data.short_leave_type
          : null,
      notes: parsed.data.notes,
      is_auto_generated: false,
      marked_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,attendance_date" },
  );

  if (error) return { error: error.message };

  let rows = await loadEmployeeRecords(
    supabase,
    parsed.data.employee_id,
    monthStart,
  );
  await syncAutoSundayLeaves(
    supabase,
    parsed.data.employee_id,
    admin.id,
    rows,
  );
  rows = await loadEmployeeRecords(
    supabase,
    parsed.data.employee_id,
    monthStart,
  );

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "attendance.marked",
    entity_type: "attendance_records",
    entity_id: parsed.data.employee_id,
    metadata: parsed.data,
  });

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/${parsed.data.employee_id}`);
  revalidatePath("/employee/attendance");
  return { success: "Attendance saved." };
}

export async function markAttendanceQuickAction(
  employeeId: string,
  attendanceDate: string,
  status: string,
  shortLeaveType?: string | null,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const parsed = markAttendanceSchema.safeParse({
    employee_id: employeeId,
    attendance_date: normalizeDateString(attendanceDate),
    status,
    short_leave_type: shortLeaveType || null,
    notes: null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const monthStart = startOfMonthDateString(parsed.data.attendance_date);
  const date = normalizeDateString(parsed.data.attendance_date);

  const { error } = await supabase.from("attendance_records").upsert(
    {
      employee_id: parsed.data.employee_id,
      attendance_date: date,
      status: parsed.data.status,
      short_leave_type:
        parsed.data.status === "short_leave"
          ? parsed.data.short_leave_type
          : null,
      is_auto_generated: false,
      marked_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,attendance_date" },
  );

  if (error) return { error: error.message };

  let rows = await loadEmployeeRecords(supabase, parsed.data.employee_id, monthStart);
  await syncAutoSundayLeaves(supabase, parsed.data.employee_id, admin.id, rows);

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/${parsed.data.employee_id}`);
  revalidatePath("/employee/attendance");
  return { success: "Saved." };
}

export async function clearAttendanceAction(
  employeeId: string,
  attendanceDate: string,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const supabase = await createClient();
  const date = normalizeDateString(attendanceDate);

  await supabase
    .from("attendance_records")
    .delete()
    .eq("employee_id", employeeId)
    .eq("attendance_date", date);

  const monthStart = startOfMonthDateString(date);
  const rows = await loadEmployeeRecords(supabase, employeeId, monthStart);
  await syncAutoSundayLeaves(supabase, employeeId, admin.id, rows);

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/${employeeId}`);
  revalidatePath("/employee/attendance");
  return { success: "Cleared." };
}

export async function deleteAttendanceAction(
  employeeId: string,
  attendanceDate: string,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("employee_id", employeeId)
    .eq("attendance_date", attendanceDate)
    .eq("is_auto_generated", false);

  if (error) return { error: error.message };

  const monthStart = startOfMonthDateString(attendanceDate);
  let rows = await loadEmployeeRecords(supabase, employeeId, monthStart);
  await syncAutoSundayLeaves(supabase, employeeId, admin.id, rows);

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/${employeeId}`);
  revalidatePath("/employee/attendance");
  return { success: "Attendance removed." };
}

export async function updateLeaveBalanceAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const monthRaw = String(formData.get("month") ?? "");
  const month = startOfMonthDateString(monthRaw);

  const parsed = leaveBalanceSchema.safeParse({
    employee_id: formData.get("employee_id"),
    month,
    paid_leave_allowance: formData.get("paid_leave_allowance"),
    half_day_allowance: formData.get("half_day_allowance"),
    short_leave_allowance: formData.get("short_leave_allowance"),
    late_allowance: formData.get("late_allowance"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", parsed.data.employee_id)
    .eq("month", parsed.data.month)
    .maybeSingle();

  const { error } = await supabase.from("leave_balances").upsert(
    {
      employee_id: parsed.data.employee_id,
      month: parsed.data.month,
      paid_leave_allowance: parsed.data.paid_leave_allowance,
      half_day_allowance: parsed.data.half_day_allowance,
      short_leave_allowance: parsed.data.short_leave_allowance,
      late_allowance: parsed.data.late_allowance,
      overtime_hours: Number(existing?.overtime_hours ?? 0),
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,month" },
  );

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "leave_balance.updated",
    entity_type: "leave_balances",
    entity_id: parsed.data.employee_id,
    metadata: parsed.data,
  });

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/${parsed.data.employee_id}`);
  revalidatePath("/employee/attendance");
  revalidatePath("/employee");
  return { success: "Leave balance updated." };
}

export async function updateOvertimeAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const monthRaw = String(formData.get("month") ?? "");
  const month = startOfMonthDateString(monthRaw);

  const parsed = overtimeSchema.safeParse({
    employee_id: formData.get("employee_id"),
    month,
    overtime_hours: formData.get("overtime_hours"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", parsed.data.employee_id)
    .eq("month", parsed.data.month)
    .maybeSingle();

  const { error } = await supabase.from("leave_balances").upsert(
    {
      employee_id: parsed.data.employee_id,
      month: parsed.data.month,
      overtime_hours: parsed.data.overtime_hours,
      paid_leave_allowance: Number(existing?.paid_leave_allowance ?? 1),
      half_day_allowance: Number(existing?.half_day_allowance ?? 1),
      short_leave_allowance: Number(existing?.short_leave_allowance ?? 1),
      late_allowance: existing?.late_allowance ?? 4,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,month" },
  );

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "overtime.updated",
    entity_type: "leave_balances",
    entity_id: parsed.data.employee_id,
    metadata: parsed.data,
  });

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/${parsed.data.employee_id}`);
  revalidatePath("/employee/attendance");
  revalidatePath("/employee");
  return { success: "Overtime saved." };
}

export async function getAttendanceSummary(
  employeeId: string,
  monthStart: string,
) {
  const { summary } = await loadMonthAttendance(employeeId, monthStart);
  return summary;
}

export { currentMonthStart };
