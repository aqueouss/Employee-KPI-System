"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import {
  leaveBalanceSchema,
  markAttendanceSchema,
} from "@/lib/validators/attendance.schema";
import {
  applyWeeklySundayLeaves,
  computeLeaveBalance,
  currentMonthStart,
  type AttendanceRecordInput,
} from "@/services/attendance/attendance.engine";
import { startOfMonthDateString } from "@/lib/utils/dates";
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
    attendance_date: row.attendance_date,
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
  const year = Number(monthStart.slice(0, 4));
  const mon = Number(monthStart.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const monthEnd = `${monthStart.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
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
  const merged = applyWeeklySundayLeaves(inputs);
  const autoRows = merged.filter((r) => r.is_auto_generated);

  for (const auto of autoRows) {
    const existing = rows.find((r) => r.attendance_date === auto.attendance_date);
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

  const requiredDates = new Set(autoRows.map((r) => r.attendance_date));
  for (const row of rows) {
    if (
      row.is_auto_generated &&
      row.status === "sunday_leave" &&
      !requiredDates.has(row.attendance_date)
    ) {
      await supabase.from("attendance_records").delete().eq("id", row.id);
    }
  }
}

async function getAllowances(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  monthStart: string,
) {
  const { data } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", monthStart)
    .maybeSingle();

  if (data) {
    return {
      paid_leave: Number(data.paid_leave_allowance),
      half_day: Number(data.half_day_allowance),
      short_leave: Number(data.short_leave_allowance),
      late: data.late_allowance,
    };
  }

  return {
    paid_leave: 1,
    half_day: 1,
    short_leave: 1,
    late: 4,
  };
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
      attendance_date: parsed.data.attendance_date,
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
  const { error } = await supabase.from("leave_balances").upsert(
    {
      employee_id: parsed.data.employee_id,
      month: parsed.data.month,
      paid_leave_allowance: parsed.data.paid_leave_allowance,
      half_day_allowance: parsed.data.half_day_allowance,
      short_leave_allowance: parsed.data.short_leave_allowance,
      late_allowance: parsed.data.late_allowance,
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
  return { success: "Leave balance updated." };
}

export async function getAttendanceSummary(
  employeeId: string,
  monthStart: string,
) {
  const supabase = await createClient();
  const rows = await loadEmployeeRecords(supabase, employeeId, monthStart);
  const allowances = await getAllowances(supabase, employeeId, monthStart);
  const monthRecords = rows
    .filter((r) => r.attendance_date.slice(0, 7) === monthStart.slice(0, 7))
    .map(toRecordInput);
  return computeLeaveBalance(monthRecords, monthStart, allowances);
}

export { currentMonthStart };
