import { redirect } from "next/navigation";

import { isKpiTracked } from "@/lib/auth/kpi-tracked";
import { requireRole } from "@/lib/auth/require-role";

export async function requireKpiEmployee() {
  const profile = await requireRole(["admin", "employee"]);
  if (profile.role === "employee" && !isKpiTracked(profile)) {
    redirect("/employee/attendance");
  }
  return profile;
}
