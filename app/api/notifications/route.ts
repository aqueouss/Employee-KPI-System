import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth/get-session";
import {
  getEmployeeNotificationExtras,
  getNotificationCounts,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const counts = await getNotificationCounts(profile, supabase);
  const extras =
    profile.role === "employee"
      ? await getEmployeeNotificationExtras(profile, supabase)
      : { attendanceMessage: null };

  return NextResponse.json(
    { role: profile.role, counts, ...extras },
    { headers: { "Cache-Control": "no-store" } },
  );
}
