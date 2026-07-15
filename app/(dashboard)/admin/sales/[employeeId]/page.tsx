import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { isSalesDepartment, requireSalesAccess } from "@/lib/sales/sales-access";
import { loadSalesReport, type SalesReportPeriod } from "@/lib/sales/sales-report";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, normalizeDateString } from "@/lib/utils/dates";
import { SalesPeriodFilter } from "@/components/sales/sales-period-filter";
import { SalesReportPanel } from "@/components/sales/sales-report-panel";
import { Button } from "@/components/ui/button";
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

export default async function AdminSalesEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ period?: string; anchor?: string }>;
}) {
  await requireSalesAccess();
  const { employeeId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("profiles")
    .select("id, full_name, email, department, hire_date, is_active, role")
    .eq("id", employeeId)
    .single();

  if (
    !employee ||
    employee.role !== "employee" ||
    !employee.is_active ||
    !isSalesDepartment(employee.department)
  ) {
    notFound();
  }

  const { data: rules } = await supabase
    .from("kpi_rules")
    .select("company_timezone")
    .eq("id", 1)
    .maybeSingle();

  const today = getTodayDateString(rules?.company_timezone ?? "UTC");
  const period = parsePeriod(query.period);
  const anchorDate = normalizeDateString(query.anchor ?? today);

  const report = await loadSalesReport(
    supabase,
    employee.id,
    period,
    anchorDate,
    employee.hire_date,
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sales team
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{employee.full_name}</h1>
        <p className="text-muted-foreground">
          Sales reports for {employee.email}
          {employee.hire_date
            ? ` · joined ${new Date(`${employee.hire_date}T12:00:00`).toLocaleDateString("en-IN")}`
            : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales report</CardTitle>
          <CardDescription>
            Monthly, quarterly, half-yearly, yearly, and lifetime sales for this
            employee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
            <SalesPeriodFilter
              period={period}
              anchorDate={anchorDate}
              basePath={`/admin/sales/${employee.id}`}
            />
          </Suspense>
          <SalesReportPanel
            summary={report.summary}
            entries={report.entries}
            deletableEntryIds={report.entries.map((entry) => entry.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
