"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getTodayDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { kpiRulesSchema } from "@/lib/validators/kpi-rules.schema";

export type AdminActionState = {
  error?: string;
  success?: string;
};

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return null;
  }
  return profile;
}

export async function createEmployeeAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Forbidden. Admin access required." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "employee");
  const hireDateRaw = String(formData.get("hire_date") ?? "").trim();
  const jobDesignation = String(formData.get("job_designation") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const employeeType = String(formData.get("employee_type") ?? "kpi");
  const kpiTracked = employeeType !== "payroll_only";

  if (!email || !email.includes("@")) {
    return { error: "A valid email is required." };
  }
  if (fullName.length < 2) {
    return { error: "Full name must be at least 2 characters." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "employee" && role !== "admin") {
    return { error: "Invalid role." };
  }
  if (role === "admin" && !kpiTracked) {
    return { error: "Admins must use KPI tracking." };
  }
  if (hireDateRaw && !/^\d{4}-\d{2}-\d{2}$/.test(hireDateRaw)) {
    return { error: "Invalid hire date." };
  }
  if (department.length > 80) {
    return { error: "Department name is too long." };
  }

  let supabaseAdmin: ReturnType<typeof createAdminClient>;
  try {
    supabaseAdmin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Admin client error." };
  }

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Failed to create user." };
  }

  // The handle_new_user trigger inserts the profile. Ensure name/role are set.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName,
      role: role as "employee" | "admin",
      hire_date: hireDateRaw ? hireDateRaw : null,
      job_designation: jobDesignation ? jobDesignation : null,
      department: department ? department : null,
      kpi_tracked: kpiTracked,
    })
    .eq("id", created.user.id);

  if (profileError) {
    return { error: `User created but profile update failed: ${profileError.message}` };
  }

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: admin.id,
    action: "employee.created",
    entity_type: "profile",
    entity_id: created.user.id,
    metadata: { email, role, kpi_tracked: kpiTracked },
  });

  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  return {
    success: `${fullName} was added as ${kpiTracked ? role : "payroll-only employee"}.`,
  };
}

export async function setEmployeeActiveAction(
  employeeId: string,
  isActive: boolean,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Forbidden. Admin access required." };
  }

  if (employeeId === admin.id) {
    return { error: "You cannot change your own active status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", employeeId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: isActive ? "employee.activated" : "employee.deactivated",
    entity_type: "profile",
    entity_id: employeeId,
    metadata: {},
  });

  revalidatePath("/admin/employees");
  return { success: isActive ? "Employee activated." : "Employee deactivated." };
}

export async function setEmployeePayrollOnlyAction(
  employeeId: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Forbidden. Admin access required." };
  }

  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return { error: "Invalid employee." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("role, full_name, kpi_tracked")
    .eq("id", employeeId)
    .single();

  if (!existing) {
    return { error: "Employee not found." };
  }
  if (existing.role === "admin") {
    return { error: "Admins must use KPI tracking." };
  }
  if (existing.kpi_tracked === false) {
    return { success: `${existing.full_name} is already payroll-only.` };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ kpi_tracked: false })
    .eq("id", employeeId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "employee.set_payroll_only",
    entity_type: "profile",
    entity_id: employeeId,
    metadata: { full_name: existing.full_name },
  });

  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/attendance");
  return { success: `${existing.full_name} is now payroll-only.` };
}

export async function deleteEmployeeAction(
  employeeId: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Forbidden. Admin access required." };
  }

  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return { error: "Invalid employee." };
  }
  if (employeeId === admin.id) {
    return { error: "You cannot delete your own account." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", employeeId)
    .single();

  if (!existing) {
    return { error: "Employee not found." };
  }
  if (existing.role === "admin") {
    return { error: "Admin accounts cannot be deleted here." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "employee.deleted",
    entity_type: "profile",
    entity_id: employeeId,
    metadata: {
      full_name: existing.full_name,
      email: existing.email,
    },
  });

  let supabaseAdmin: ReturnType<typeof createAdminClient>;
  try {
    supabaseAdmin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Admin client error." };
  }

  const { error: deleteError } =
    await supabaseAdmin.auth.admin.deleteUser(employeeId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/attendance");
  return { success: `${existing.full_name} was deleted.` };
}

export async function updateKpiRulesAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Forbidden. Admin access required." };
  }

  const parsed = kpiRulesSchema.safeParse({
    green_threshold: formData.get("green_threshold"),
    yellow_threshold: formData.get("yellow_threshold"),
    red_flags_for_warning: formData.get("red_flags_for_warning"),
    warnings_for_termination: formData.get("warnings_for_termination"),
    termination_window_days: formData.get("termination_window_days"),
    green_streak_for_reward: formData.get("green_streak_for_reward"),
    company_timezone: formData.get("company_timezone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("kpi_rules")
    .select("version")
    .eq("id", 1)
    .single();

  if (fetchError || !current) {
    return { error: "Failed to load current KPI rules." };
  }

  const { error } = await supabase
    .from("kpi_rules")
    .update({
      ...parsed.data,
      version: current.version + 1,
      updated_by: admin.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "kpi_rules.updated",
    entity_type: "kpi_rules",
    entity_id: null,
    metadata: { ...parsed.data, version: current.version + 1 },
  });

  revalidatePath("/admin/kpi-rules");
  return { success: `KPI rules saved (v${current.version + 1}).` };
}

export async function updateEmployeeDetailsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Forbidden. Admin access required." };
  }

  const employeeId = String(formData.get("employee_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return { error: "Invalid employee." };
  }

  const hireDateRaw = String(formData.get("hire_date") ?? "").trim();
  const jobDesignation = String(formData.get("job_designation") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const monthlySalaryRaw = String(formData.get("monthly_salary") ?? "").trim();
  const salaryEffectiveMonthRaw = String(
    formData.get("salary_effective_month") ?? "",
  ).trim();

  if (hireDateRaw && !/^\d{4}-\d{2}-\d{2}$/.test(hireDateRaw)) {
    return { error: "Invalid hire date." };
  }
  if (jobDesignation.length > 120) {
    return { error: "Job designation is too long." };
  }
  if (department.length > 80) {
    return { error: "Department name is too long." };
  }
  if (salaryEffectiveMonthRaw && !/^\d{4}-\d{2}$/.test(salaryEffectiveMonthRaw)) {
    return { error: "Invalid salary effective month." };
  }
  let monthlySalary: number | null = null;
  if (monthlySalaryRaw) {
    monthlySalary = Number(monthlySalaryRaw);
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      return { error: "Invalid monthly salary." };
    }
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("role, kpi_tracked, monthly_salary")
    .eq("id", employeeId)
    .single();

  if (!existing) {
    return { error: "Employee not found." };
  }

  const submittedKpiTracked = formData.get("kpi_tracked");
  const kpiTracked =
    submittedKpiTracked === "false"
      ? false
      : submittedKpiTracked === "true"
        ? true
        : existing.kpi_tracked !== false;

  if (existing.role === "admin" && !kpiTracked) {
    return { error: "Admins must use KPI tracking." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      hire_date: hireDateRaw ? hireDateRaw : null,
      job_designation: jobDesignation ? jobDesignation : null,
      department: department ? department : null,
      monthly_salary: monthlySalary,
      kpi_tracked: kpiTracked,
    })
    .eq("id", employeeId);

  if (error) {
    return { error: error.message };
  }

  const previousSalary =
    existing.monthly_salary != null ? Number(existing.monthly_salary) : null;
  const salaryChanged = previousSalary !== monthlySalary;

  if (salaryChanged && monthlySalary !== null) {
    const effectiveMonth = salaryEffectiveMonthRaw
      ? startOfMonthDateString(`${salaryEffectiveMonthRaw}-01`)
      : startOfMonthDateString(getTodayDateString());

    if (previousSalary !== null && previousSalary !== monthlySalary) {
      const { data: priorRevision } = await supabase
        .from("salary_revisions")
        .select("effective_month")
        .eq("employee_id", employeeId)
        .lt("effective_month", effectiveMonth)
        .order("effective_month", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!priorRevision) {
        const { data: employeeProfile } = await supabase
          .from("profiles")
          .select("hire_date, created_at")
          .eq("id", employeeId)
          .single();

        const seedMonth = employeeProfile?.hire_date
          ? startOfMonthDateString(employeeProfile.hire_date)
          : startOfMonthDateString(
              employeeProfile?.created_at ?? getTodayDateString(),
            );

        if (seedMonth < effectiveMonth) {
          const { error: seedError } = await supabase
            .from("salary_revisions")
            .upsert(
              {
                employee_id: employeeId,
                effective_month: seedMonth,
                monthly_salary: previousSalary,
                updated_by: admin.id,
              },
              { onConflict: "employee_id,effective_month" },
            );

          if (seedError) {
            return { error: seedError.message };
          }
        }
      }
    }

    const { error: revisionError } = await supabase
      .from("salary_revisions")
      .upsert(
        {
          employee_id: employeeId,
          effective_month: effectiveMonth,
          monthly_salary: monthlySalary,
          updated_by: admin.id,
        },
        { onConflict: "employee_id,effective_month" },
      );

    if (revisionError) {
      return { error: revisionError.message };
    }
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "employee.details_updated",
    entity_type: "profile",
    entity_id: employeeId,
    metadata: {
      hire_date: hireDateRaw || null,
      job_designation: jobDesignation || null,
      department: department || null,
      monthly_salary: monthlySalary,
      kpi_tracked: kpiTracked,
    },
  });

  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  revalidatePath(`/admin/attendance/${employeeId}`);
  revalidatePath("/admin/payroll");
  revalidatePath("/employee/attendance");
  return { success: "Employee details updated." };
}
