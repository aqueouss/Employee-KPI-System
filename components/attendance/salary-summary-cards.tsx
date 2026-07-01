import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SalarySummary } from "@/services/attendance/attendance.engine";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SalarySummaryCards({ summary }: { summary: SalarySummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Working days</CardDescription>
          <CardTitle className="text-2xl">{summary.total_working_days}</CardTitle>
          <p className="text-xs text-muted-foreground">Mon–Sat in month</p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Salaried days</CardDescription>
          <CardTitle className="text-2xl">{summary.salaried_days}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {summary.salaried_days} marked
            {summary.extra_half_days > 0
              ? ` − ${summary.extra_half_days} extra half`
              : ""}
          </p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Absent days</CardDescription>
          <CardTitle className="text-2xl">{summary.absent_days}</CardTitle>
          {summary.extra_half_days > 0 ? (
            <p className="text-xs text-muted-foreground">
              +{summary.extra_half_days} extra half-day deduction
            </p>
          ) : null}
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Salary this month</CardDescription>
          <CardTitle className="text-2xl">
            {summary.calculated_salary !== null
              ? formatCurrency(summary.calculated_salary)
              : "—"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {summary.monthly_salary !== null && summary.daily_rate !== null
              ? `${formatCurrency(summary.monthly_salary)} ÷ ${summary.month_calendar_days} days × ${summary.salaried_days} marked`
              : "Monthly salary not set"}
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
