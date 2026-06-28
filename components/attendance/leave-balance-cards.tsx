import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { LeaveBalanceSummary } from "@/services/attendance/attendance.engine";

function balanceVariant(remaining: number) {
  if (remaining < 0) return "destructive" as const;
  if (remaining === 0) return "warning" as const;
  return "success" as const;
}

function paidLeaveDetail(summary: LeaveBalanceSummary): string | undefined {
  const parts: string[] = [];
  if (summary.overtime_paid_leave_credit > 0) {
    parts.push(
      `${summary.overtime_hours}h OT → +${summary.overtime_paid_leave_credit} leave`,
    );
  }
  if (summary.paid_leave_carried_forward > 0) {
    parts.push(`+${summary.paid_leave_carried_forward} carried forward`);
  }
  if (parts.length === 0) return undefined;
  return `${summary.paid_leave_base} monthly${parts.length ? ` · ${parts.join(" · ")}` : ""}`;
}

export function LeaveBalanceCards({ summary }: { summary: LeaveBalanceSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BalanceCard
        label="Paid leave"
        remaining={summary.paid_leave_remaining}
        total={summary.paid_leave}
        detail={paidLeaveDetail(summary)}
        accent="from-primary/80 to-brand/60"
      />
      <BalanceCard
        label="Half day"
        remaining={summary.half_day_remaining}
        total={summary.half_day}
        accent="from-brand/70 to-primary/50"
      />
      <BalanceCard
        label="Short leave"
        remaining={summary.short_leave_remaining}
        total={summary.short_leave}
        accent="from-emerald-700/70 to-brand/50 dark:from-brand/80 dark:to-primary/60"
      />
      <BalanceCard
        label="Lates left"
        remaining={summary.late_remaining}
        total={summary.late}
        detail={
          summary.penalty_half_days > 0
            ? `+${summary.penalty_half_days} half from extra lates`
            : undefined
        }
        accent="from-amber-700/75 to-primary/55 dark:from-primary/70 dark:to-brand/50"
      />
    </div>
  );
}

function BalanceCard({
  label,
  remaining,
  total,
  detail,
  accent,
}: {
  label: string;
  remaining: number;
  total: number;
  detail?: string;
  accent: string;
}) {
  return (
    <Card className="group relative overflow-hidden hover-lift">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} opacity-80 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <CardHeader className="pb-2 pt-5">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-baseline gap-2">
          <Badge variant={balanceVariant(remaining)} className="text-base">
            {remaining}
          </Badge>
          <span className="text-sm font-normal text-muted-foreground">
            of {total} left
          </span>
        </CardTitle>
        {detail ? (
          <p className="text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
