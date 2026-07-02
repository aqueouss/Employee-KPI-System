import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth/get-session";
import { buildAttendanceCsv } from "@/lib/reports/report-csv";
import { loadMonthlyAttendanceExport } from "@/lib/reports/load-monthly-attendance-export";
import {
  getTodayDateString,
  parseDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  const format = url.searchParams.get("format") ?? "csv";
  const month =
    parseDateString(monthParam) !== null
      ? startOfMonthDateString(monthParam!)
      : startOfMonthDateString(getTodayDateString());

  const report = await loadMonthlyAttendanceExport(month);

  if (format === "json") {
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const csv = `\uFEFF${buildAttendanceCsv(report)}`;
  const filename = `aqueouss-attendance-${month.slice(0, 7)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
