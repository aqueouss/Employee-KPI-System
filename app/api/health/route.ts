import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("kpi_rules").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          db: "error",
          message: error.message,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      db: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        db: "unconfigured",
        message: "Supabase environment variables are missing or invalid.",
      },
      { status: 503 },
    );
  }
}
