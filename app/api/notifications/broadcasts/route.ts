import { NextResponse } from "next/server";

import { loadPendingBroadcastNotifications } from "@/lib/broadcast-notifications";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (profile.role !== "employee") {
    return NextResponse.json({ notifications: [] });
  }

  const supabase = await createClient();
  const notifications = await loadPendingBroadcastNotifications(
    supabase,
    profile.id,
  );

  return NextResponse.json(
    { notifications },
    { headers: { "Cache-Control": "no-store" } },
  );
}
