import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/get-session";

export default async function HomePage() {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.kpi_tracked === false) {
    redirect("/employee/attendance");
  }

  redirect("/employee");
}
