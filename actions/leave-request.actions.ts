"use server";

import { revalidatePath } from "next/cache";

import { applyAttendanceMark } from "@/actions/attendance.actions";
import { getSessionProfile } from "@/lib/auth/get-session";
import { validateLeaveRequestEligibility } from "@/lib/leave/leave-request-eligibility";
import { getKpiRules } from "@/services/kpi/kpi.service";
import { createClient } from "@/lib/supabase/server";
import {
  createLeaveRequestSchema,
  leaveRequestIdSchema,
  reviewLeaveRequestSchema,
} from "@/lib/validators/leave-request.schema";
import { normalizeDateString } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";
import type { LeaveRequestType } from "@/types/domain";

export type LeaveRequestActionState = {
  error?: string;
  success?: string;
};

function revalidateLeavePaths() {
  revalidatePath("/employee/attendance");
  revalidatePath("/admin/attendance/leaves");
  revalidatePath("/admin/attendance");
}

function leaveTypeToAttendanceStatus(
  leaveType: LeaveRequestType,
): Tables<"attendance_records">["status"] {
  return leaveType;
}

async function assertNoConflictingRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  leaveDate: string,
  excludeId?: string,
) {
  let query = supabase
    .from("leave_requests")
    .select("id, status")
    .eq("employee_id", employeeId)
    .eq("leave_date", leaveDate)
    .in("status", ["pending", "approved"]);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query.maybeSingle();
  if (data) {
    return "A pending or approved leave request already exists for this date.";
  }

  return null;
}

async function assertNoExistingAttendance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  leaveDate: string,
) {
  const { data } = await supabase
    .from("attendance_records")
    .select("status, is_auto_generated")
    .eq("employee_id", employeeId)
    .eq("attendance_date", leaveDate)
    .maybeSingle();

  if (!data || data.is_auto_generated) return null;

  return "Attendance is already marked for this date.";
}

export async function createLeaveRequestAction(
  _prev: LeaveRequestActionState,
  formData: FormData,
): Promise<LeaveRequestActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "employee") {
    return { error: "Only employees can apply for leave." };
  }

  const parsed = createLeaveRequestSchema.safeParse({
    leave_date: formData.get("leave_date"),
    leave_type: formData.get("leave_type"),
    short_leave_type: formData.get("short_leave_type") || null,
    reason: formData.get("reason") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const leaveDate = normalizeDateString(parsed.data.leave_date);
  const supabase = await createClient();
  const rules = await getKpiRules(supabase);

  const eligibilityError = validateLeaveRequestEligibility(
    leaveDate,
    parsed.data.leave_type,
    rules.company_timezone,
  );
  if (eligibilityError) return { error: eligibilityError };

  const conflictError = await assertNoConflictingRequest(
    supabase,
    profile.id,
    leaveDate,
  );
  if (conflictError) return { error: conflictError };

  const attendanceError = await assertNoExistingAttendance(
    supabase,
    profile.id,
    leaveDate,
  );
  if (attendanceError) return { error: attendanceError };

  const { error } = await supabase.from("leave_requests").insert({
    employee_id: profile.id,
    leave_date: leaveDate,
    leave_type: parsed.data.leave_type,
    short_leave_type:
      parsed.data.leave_type === "short_leave"
        ? parsed.data.short_leave_type
        : null,
    reason: parsed.data.reason?.trim() ? parsed.data.reason.trim() : null,
  });

  if (error) return { error: error.message };

  revalidateLeavePaths();
  return { success: "Leave request submitted for approval." };
}

export async function cancelLeaveRequestAction(
  _prev: LeaveRequestActionState,
  formData: FormData,
): Promise<LeaveRequestActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = leaveRequestIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("employee_id, status")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !existing) return { error: "Leave request not found." };
  if (existing.employee_id !== profile.id) return { error: "Forbidden." };
  if (existing.status !== "pending") {
    return { error: "Only pending requests can be cancelled." };
  }

  const { error } = await supabase
    .from("leave_requests")
    .delete()
    .eq("id", parsed.data.id)
    .eq("employee_id", profile.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidateLeavePaths();
  return { success: "Leave request cancelled." };
}

export async function reviewLeaveRequestAction(
  _prev: LeaveRequestActionState,
  formData: FormData,
): Promise<LeaveRequestActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.role !== "admin") return { error: "Forbidden." };

  const parsed = reviewLeaveRequestSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: request, error: fetchError } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !request) return { error: "Leave request not found." };
  if (request.status !== "pending") {
    return { error: "This request has already been reviewed." };
  }

  const leaveDate = normalizeDateString(request.leave_date);
  const now = new Date().toISOString();

  if (parsed.data.decision === "approved") {
    const attendanceError = await assertNoExistingAttendance(
      supabase,
      request.employee_id,
      leaveDate,
    );
    if (attendanceError) return { error: attendanceError };

    try {
      await applyAttendanceMark(supabase, {
        employeeId: request.employee_id,
        attendanceDate: leaveDate,
        status: leaveTypeToAttendanceStatus(request.leave_type),
        shortLeaveType: request.short_leave_type,
        markedBy: profile.id,
        notes: request.reason,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to mark attendance.",
      };
    }
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: parsed.data.decision,
      reviewed_by: profile.id,
      reviewed_at: now,
      review_note: parsed.data.note?.trim() ? parsed.data.note.trim() : null,
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: `leave_request.${parsed.data.decision}`,
    entity_type: "leave_requests",
    entity_id: parsed.data.id,
    metadata: {
      employee_id: request.employee_id,
      leave_date: leaveDate,
      leave_type: request.leave_type,
      note: parsed.data.note ?? "",
    },
  });

  revalidateLeavePaths();
  return {
    success:
      parsed.data.decision === "approved"
        ? "Leave approved and attendance updated."
        : "Leave request rejected.",
  };
}
