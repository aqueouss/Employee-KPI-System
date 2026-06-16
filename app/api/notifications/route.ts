import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth/get-session";
import { getNotificationCounts } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await getNotificationCounts(profile);
  return NextResponse.json(
    { role: profile.role, counts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
