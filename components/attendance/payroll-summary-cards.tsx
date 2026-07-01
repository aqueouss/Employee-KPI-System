import type { ReactNode } from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PayrollSummary } from "@/services/attendance/attendance.engine";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAmount(amount: number | null): string {
  return amount !== null ? formatCurrency(amount) : "—";
}

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent: string;
}) {
  return (
    <Card className="group relative overflow-hidden hover-lift">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} opacity-80 transition-opacity group-hover:opacity-100`}
      />
      <CardHeader className="pb-2 pt-5">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl transition-colors group-hover:text-primary">
          {value}
        </CardTitle>
        {detail ? (
          <p className="text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export function PayrollSummaryCards({ summary }: { summary: PayrollSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Working days"
          value={summary.total_working_days}
          detail="Mon–Sat in month"
          accent="from-primary/75 to-brand/55"
        />
        <StatCard
          label="Salaried days"
          value={summary.salaried_days}
          detail={
            <>
              {summary.salaried_days} marked
              {summary.extra_half_days > 0
                ? ` − ${summary.extra_half_days} extra half`
                : ""}
            </>
          }
          accent="from-brand/70 to-primary/50"
        />
        <StatCard
          label="Absent days"
          value={summary.absent_days}
          detail={
            summary.extra_half_days > 0
              ? `+${summary.extra_half_days} extra half-day deduction`
              : undefined
          }
          accent="from-destructive/70 to-primary/40"
        />
        <StatCard
          label="Attendance salary"
          value={formatAmount(summary.calculated_salary)}
          detail={
            summary.monthly_salary !== null && summary.daily_rate !== null
              ? `${formatCurrency(summary.monthly_salary)} ÷ ${summary.month_calendar_days} days × ${summary.salaried_days} marked`
              : "Monthly salary not set"
          }
          accent="from-brand/75 to-emerald-700/55 dark:from-brand/80 dark:to-primary/60"
        />
      </div>

      <Card className="relative overflow-hidden">
        <div className="theme-accent-bar absolute inset-x-0 top-0" />
        <CardHeader className="pb-2 pt-6">
          <CardDescription>Payroll breakdown</CardDescription>
          <CardTitle className="gradient-text text-3xl">
            {formatAmount(summary.net_salary)}
          </CardTitle>
          <p className="text-xs text-muted-foreground">Net salary this month</p>
        </CardHeader>
        <div className="border-t border-border/60 px-6 pb-4 pt-3 text-sm">
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary/5">
              <dt className="text-muted-foreground">Attendance salary</dt>
              <dd className="font-medium tabular-nums">
                {formatAmount(summary.calculated_salary)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-brand/8">
              <dt className="text-muted-foreground">+ Incentives</dt>
              <dd className="font-medium tabular-nums text-brand dark:text-brand">
                {formatCurrency(summary.incentives)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-brand/8">
              <dt className="text-muted-foreground">+ Conveyance</dt>
              <dd className="font-medium tabular-nums text-brand dark:text-brand">
                {formatCurrency(summary.conveyance)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2">
              <dt className="font-medium">Gross salary</dt>
              <dd className="font-semibold tabular-nums">
                {formatAmount(summary.gross_salary)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-destructive/5">
              <dt className="text-muted-foreground">− Advance deduction</dt>
              <dd className="font-medium tabular-nums text-destructive">
                {formatCurrency(summary.advance_deduction)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2">
              <dt className="font-medium">Net salary</dt>
              <dd className="text-lg font-semibold tabular-nums text-primary">
                {formatAmount(summary.net_salary)}
              </dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  );
}
