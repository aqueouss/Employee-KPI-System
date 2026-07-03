"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import {
  bulkMarkAttendanceSchema,
  leaveBalanceSchema,
  markAttendanceSchema,
  overtimeSchema,
  payrollSchema,
} from "@/lib/validators/attendance.schema";
import { payrollOtherExpensesSchema, parsePayrollOtherExpensesItems } from "@/lib/validators/payroll-other-expenses.schema";
import { payrollOtherExpensesToJson } from "@/lib/payroll/other-expenses";
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

function revalidateAttendancePaths(employeeIds: string[] = []) {
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/attendance/today");
  revalidatePath("/admin/attendance/leaves");
  revalidatePath("/employee/attendance");
  for (const employeeId of employeeIds) {
    revalidatePath(`/admin/attendance/${employeeId}`);
  }
}

export async function applyAttendanceMark(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    employeeId: string;
    attendanceDate: string;
    status: Tables<"attendance_records">["status"];
    shortLeaveType?: Tables<"attendance_records">["short_leave_type"] | null;
    markedBy: string;
    notes?: string | null;
  },
) {
  const date = normalizeDateString(params.attendanceDate);
  const monthStart = startOfMonthDateString(date);

  const { error } = await supabase.from("attendance_records").upsert(
    {
      employee_id: params.employeeId,
      attendance_date: date,
      status: params.status,
      short_leave_type:
        params.status === "short_leave" ? params.shortLeaveType ?? null : null,
      notes: params.notes ?? null,
      is_auto_generated: false,
      marked_by: params.markedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,attendance_date" },
  );

  if (error) throw new Error(error.message);

  let rows = await loadEmployeeRecords(supabase, params.employeeId, monthStart);
  await syncAutoSundayLeaves(
    supabase,
    params.employeeId,
    params.markedBy,
    rows,
  );
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

  revalidateAttendancePaths([parsed.data.employee_id]);
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

  revalidateAttendancePaths([parsed.data.employee_id]);
  return { success: "Saved." };
}

export async function markBulkAttendanceAction(
  attendanceDate: string,
  entries: Array<{
    employee_id: string;
    status: string;
    short_leave_type?: string | null;
  }>,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const parsed = bulkMarkAttendanceSchema.safeParse({
    attendance_date: normalizeDateString(attendanceDate),
    entries,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const date = normalizeDateString(parsed.data.attendance_date);
  const monthStart = startOfMonthDateString(date);
  const now = new Date().toISOString();
  const employeeIds = new Set<string>();

  for (const entry of parsed.data.entries) {
    const { error } = await supabase.from("attendance_records").upsert(
      {
        employee_id: entry.employee_id,
        attendance_date: date,
        status: entry.status,
        short_leave_type:
          entry.status === "short_leave" ? entry.short_leave_type : null,
        is_auto_generated: false,
        marked_by: admin.id,
        updated_at: now,
      },
      { onConflict: "employee_id,attendance_date" },
    );

    if (error) return { error: error.message };
    employeeIds.add(entry.employee_id);
  }

  for (const employeeId of employeeIds) {
    const rows = await loadEmployeeRecords(supabase, employeeId, monthStart);
    await syncAutoSundayLeaves(supabase, employeeId, admin.id, rows);
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "attendance.bulk_marked",
    entity_type: "attendance_records",
    entity_id: admin.id,
    metadata: {
      attendance_date: date,
      employee_count: parsed.data.entries.length,
    },
  });

  revalidateAttendancePaths([...employeeIds]);
  return {
    success: `Attendance saved for ${parsed.data.entries.length} employee${
      parsed.data.entries.length === 1 ? "" : "s"
    }.`,
  };
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

  revalidateAttendancePaths([employeeId]);
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

  revalidateAttendancePaths([employeeId]);
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

  revalidateAttendancePaths([parsed.data.employee_id]);
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

  revalidateAttendancePaths([parsed.data.employee_id]);
  revalidatePath("/employee");
  return { success: "Overtime saved." };
}

export async function updatePayrollAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const monthRaw = String(formData.get("month") ?? "");
  const month = startOfMonthDateString(monthRaw);
  const notesRaw = formData.get("notes");
  const notes =
    notesRaw === null || String(notesRaw).trim() === ""
      ? null
      : String(notesRaw).trim();

  const parsed = payrollSchema.safeParse({
    employee_id: formData.get("employee_id"),
    month,
    incentives: formData.get("incentives"),
    conveyance: formData.get("conveyance"),
    advance_deduction: formData.get("advance_deduction"),
    notes,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("monthly_payroll").upsert(
    {
      employee_id: parsed.data.employee_id,
      month: parsed.data.month,
      incentives: parsed.data.incentives,
      conveyance: parsed.data.conveyance,
      advance_deduction: parsed.data.advance_deduction,
      notes: parsed.data.notes ?? null,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,month" },
  );

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "payroll.updated",
    entity_type: "monthly_payroll",
    entity_id: parsed.data.employee_id,
    metadata: parsed.data,
  });

  revalidateAttendancePaths([parsed.data.employee_id]);
  revalidatePath("/employee");
  return { success: "Payroll saved." };
}

export async function updatePayrollOtherExpensesAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden." };

  const monthRaw = String(formData.get("month") ?? "");
  const month = startOfMonthDateString(monthRaw);
  const itemsRaw = parsePayrollOtherExpensesItems(formData.get("items_json"));
  if (itemsRaw === null) {
    return { error: "Invalid other expenses data." };
  }

  const parsed = payrollOtherExpensesSchema.safeParse({
    month,
    items: itemsRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const items = parsed.data.items.filter(
    (item) => item.title.trim() || item.expense > 0 || item.remarks.trim(),
  );

  const supabase = await createClient();

  const { error } = await supabase.from("monthly_payroll_other_expenses").upsert(
    {
      month: parsed.data.month,
      items: payrollOtherExpensesToJson(items),
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "month" },
  );

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "payroll.other_expenses_updated",
    entity_type: "monthly_payroll_other_expenses",
    entity_id: admin.id,
    metadata: { month: parsed.data.month },
  });

  revalidatePath("/admin/payroll");
  return { success: "Other expenses saved." };
}

export async function getAttendanceSummary(
  employeeId: string,
  monthStart: string,
) {
  const { summary } = await loadMonthAttendance(employeeId, monthStart);
  return summary;
}

export { currentMonthStart };
