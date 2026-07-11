import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth/get-session";
import { getNotificationCounts, getEmployeeNotificationExtras } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await getNotificationCounts(profile);
  const extras =
    profile.role === "employee"
      ? await getEmployeeNotificationExtras(profile)
      : { attendanceMessage: null };

  return NextResponse.json(
    { role: profile.role, counts, ...extras },
    { headers: { "Cache-Control": "no-store" } },
  );
}
