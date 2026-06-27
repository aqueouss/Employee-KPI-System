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
      />
      <BalanceCard
        label="Half day"
        remaining={summary.half_day_remaining}
        total={summary.half_day}
      />
      <BalanceCard
        label="Short leave"
        remaining={summary.short_leave_remaining}
        total={summary.short_leave}
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
      />
    </div>
  );
}

function BalanceCard({
  label,
  remaining,
  total,
  detail,
}: {
  label: string;
  remaining: number;
  total: number;
  detail?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
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
