import { Suspense } from "react";

import { requireSalesEmployee } from "@/lib/sales/sales-access";
import { loadSalesReport, type SalesReportPeriod } from "@/lib/sales/sales-report";
import { createClient } from "@/lib/supabase/server";
import {
  endOfMonthDateString,
  getTodayDateString,
  normalizeDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { SalesEntryForm } from "@/components/sales/sales-entry-form";
import { SalesPeriodFilter } from "@/components/sales/sales-period-filter";
import { SalesReportPanel } from "@/components/sales/sales-report-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function parsePeriod(value: string | undefined): SalesReportPeriod {
  if (
    value === "quarterly" ||
    value === "half_yearly" ||
    value === "yearly" ||
    value === "all_time"
  ) {
    return value;
  }
  return "monthly";
}

export default async function EmployeeSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; anchor?: string }>;
}) {
  const profile = await requireSalesEmployee();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("kpi_rules")
    .select("company_timezone")
    .eq("id", 1)
    .maybeSingle();

  const today = getTodayDateString(rules?.company_timezone ?? "UTC");
  const period = parsePeriod(params.period);
  const anchorDate = normalizeDateString(params.anchor ?? today);
  const monthLabel = new Date(`${startOfMonthDateString(today)}T12:00:00`).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" },
  );

  const report = await loadSalesReport(
    supabase,
    profile.id,
    period,
    anchorDate,
    profile.hire_date,
  );

  const monthStart = startOfMonthDateString(today);
  const monthEnd = endOfMonthDateString(today);
  const deletableEntryIds = report.entries
    .filter(
      (entry) => entry.sale_date >= monthStart && entry.sale_date <= monthEnd,
    )
    .map((entry) => entry.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales report</h1>
        <p className="text-muted-foreground">
          Log customer sales for the current month and review monthly, quarterly,
          half-yearly, yearly, and lifetime totals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add sale</CardTitle>
          <CardDescription>
            Customer details, item, quantity, price, and remarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesEntryForm today={today} monthLabel={monthLabel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales reports</CardTitle>
          <CardDescription>
            Filter by period to review your performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
            <SalesPeriodFilter
              period={period}
              anchorDate={anchorDate}
              basePath="/employee/sales"
            />
          </Suspense>
          <SalesReportPanel
            summary={report.summary}
            entries={report.entries}
            deletableEntryIds={deletableEntryIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
