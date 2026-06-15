import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/get-session";
import type { UserRole } from "@/types/domain";

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(profile.role === "admin" ? "/admin" : "/employee");
  }

  return profile;
}
