import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseDateString } from "@/lib/utils/dates";
import { runDailyKpiPipeline } from "@/services/kpi/kpi.service";

export const dynamic = "force-dynamic";

const PLACEHOLDER_SECRETS = new Set([
  "generate-a-long-random-string",
  "random-string",
  "your-cron-secret",
]);

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${secret}`);
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Date may be provided via ?date= or JSON body { kpi_date }.
  let date: string | null = parseDateString(
    request.nextUrl.searchParams.get("date"),
  );

  if (!date && request.method === "POST") {
    try {
      const body = await request.json();
      date = parseDateString(body?.kpi_date);
    } catch {
      // No/invalid body — fall back to default (yesterday).
    }
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin client error." },
      { status: 503 },
    );
  }

  try {
    const summary = await runDailyKpiPipeline(admin, date ?? undefined);

    await admin.from("audit_logs").insert({
      actor_id: null,
      action: "cron.daily_kpi",
      entity_type: "daily_kpi_snapshots",
      entity_id: null,
      metadata: {
        kpi_date: summary.kpiDate,
        processed: summary.processed,
        flags: summary.flags,
        warnings_issued: summary.warningsIssued,
        termination_reviews_opened: summary.terminationReviewsOpened,
        rewards_created: summary.rewardsCreated,
      },
    });

    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pipeline failed." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
