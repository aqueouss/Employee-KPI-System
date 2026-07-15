import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { normalizeDepartment } from "@/lib/departments/department-utils";
import type { Profile } from "@/types/domain";

export const SALES_DEPARTMENT = "Sales";

export function isSalesDepartment(department: string | null | undefined): boolean {
  return normalizeDepartment(department).toLowerCase() === SALES_DEPARTMENT.toLowerCase();
}

export function hasSalesAccess(profile: Pick<Profile, "role" | "department">): boolean {
  return profile.role === "admin" || isSalesDepartment(profile.department);
}

export async function requireSalesEmployee() {
  const profile = await requireRole(["employee"]);
  if (!isSalesDepartment(profile.department)) {
    redirect("/employee");
  }
  return profile;
}

export async function requireSalesAccess() {
  const profile = await requireRole(["admin", "employee"]);
  if (!hasSalesAccess(profile)) {
    redirect(profile.role === "admin" ? "/admin" : "/employee");
  }
  return profile;
}
