import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { isSalesDepartment, requireSalesAccess } from "@/lib/sales/sales-access";
import {
  formatSalesCurrency,
  loadSalesReport,
  type SalesReportPeriod,
} from "@/lib/sales/sales-report";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, normalizeDateString } from "@/lib/utils/dates";
import { SalesPeriodFilter } from "@/components/sales/sales-period-filter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; anchor?: string }>;
}) {
  await requireSalesAccess();
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

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, email, department, hire_date, is_active")
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const salesEmployees = (employees ?? []).filter((employee) =>
    isSalesDepartment(employee.department),
  );

  const reports = await Promise.all(
    salesEmployees.map(async (employee) => {
      const monthlyReport = await loadSalesReport(
        supabase,
        employee.id,
        "monthly",
        today,
        employee.hire_date,
      );
      const periodReport = await loadSalesReport(
        supabase,
        employee.id,
        period,
        anchorDate,
        employee.hire_date,
      );
      return { employee, monthlyReport, periodReport };
    }),
  );

  const teamMonthlyNetTotal = reports.reduce(
    (sum, row) => sum + row.monthlyReport.summary.totalNetAmount,
    0,
  );
  const teamMonthlyTotal = reports.reduce(
    (sum, row) => sum + row.monthlyReport.summary.totalAmount,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales reports</h1>
        <p className="text-muted-foreground">
          Review sales performance for the Sales team across monthly, quarterly,
          half-yearly, yearly, and lifetime periods.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sales team members</CardDescription>
            <CardTitle className="text-3xl">{salesEmployees.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team net sales this month</CardDescription>
            <CardTitle className="text-3xl">
              {formatSalesCurrency(teamMonthlyNetTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team total sales this month</CardDescription>
            <CardTitle className="text-3xl">
              {formatSalesCurrency(teamMonthlyTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales team</CardTitle>
          <CardDescription>Open an employee&apos;s detailed sales report.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {reports.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active Sales employees found. Assign department &quot;Sales&quot; on
              employee profiles.
            </p>
          ) : (
            reports.map(({ employee, monthlyReport }) => (
              <div
                key={employee.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{employee.full_name}</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                  <p className="mt-1 text-sm">
                    This month: net {formatSalesCurrency(monthlyReport.summary.totalNetAmount)} · total{" "}
                    {formatSalesCurrency(monthlyReport.summary.totalAmount)} ·{" "}
                    {monthlyReport.summary.entryCount} sale
                    {monthlyReport.summary.entryCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/sales/${employee.id}`}>
                    View reports
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team snapshot</CardTitle>
          <CardDescription>
            Compare sales employees for the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
            <SalesPeriodFilter
              period={period}
              anchorDate={anchorDate}
              basePath="/admin/sales"
            />
          </Suspense>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-right">Net sales</th>
                  <th className="px-4 py-3 text-right">Total sales</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map(({ employee, periodReport }) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/sales/${employee.id}?period=${period}&anchor=${anchorDate}`}
                        className="font-medium hover:underline"
                      >
                        {employee.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatSalesCurrency(periodReport.summary.totalNetAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatSalesCurrency(periodReport.summary.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {periodReport.summary.totalQuantity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {periodReport.summary.entryCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
