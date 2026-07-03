import { requireRole } from "@/lib/auth/require-role";
import {
  getTodayDateString,
  parseDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { loadDepartmentPayroll } from "@/lib/payroll/department-payroll";
import {
  payrollOtherExpensesFromRow,
} from "@/lib/payroll/other-expenses";
import { formatMonthLabel } from "@/lib/payroll/format-month-label";
import { DepartmentPayrollSection } from "@/components/admin/department-payroll-section";
import { MonthlyPayrollExportButtons } from "@/components/admin/monthly-report-export-buttons";
import { PayrollOtherExpensesForm } from "@/components/admin/payroll-other-expenses-form";
import { MonthNav } from "@/components/attendance/month-nav";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const month =
    parseDateString(sp.month) !== null
      ? startOfMonthDateString(sp.month!)
      : startOfMonthDateString(getTodayDateString());

  const report = await loadDepartmentPayroll(month);
  const supabase = await createClient();
  const { data: otherExpensesRow } = await supabase
    .from("monthly_payroll_other_expenses")
    .select("*")
    .eq("month", report.monthStart)
    .maybeSingle();
  const otherExpenses = payrollOtherExpensesFromRow(otherExpensesRow);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Monthly payroll
          </h1>
          <p className="text-muted-foreground">
            {formatMonthLabel(report.monthStart)} — net salary by department.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthNav basePath="/admin/payroll" monthStart={report.monthStart} />
          <MonthlyPayrollExportButtons monthStart={report.monthStart} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total expense this month</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatCurrency(report.grandTotalExpense)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sum of each employee&apos;s max(attendance salary, net salary).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net salary to be paid</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatCurrency(report.grandTotalNet)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {report.totalEmployees} active employee
              {report.totalEmployees === 1 ? "" : "s"} across{" "}
              {report.departments.length} department
              {report.departments.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Other expenses</CardTitle>
          <CardDescription>
            Add as many expense lines as needed for this month&apos;s payroll export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PayrollOtherExpensesForm
            month={report.monthStart}
            items={otherExpenses}
          />
        </CardContent>
      </Card>

      {report.departments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No active employees found for this month.
          </CardContent>
        </Card>
      ) : (
        report.departments.map((group) => (
          <DepartmentPayrollSection
            key={group.slug}
            group={group}
            monthStart={report.monthStart}
          />
        ))
      )}
    </div>
  );
}
