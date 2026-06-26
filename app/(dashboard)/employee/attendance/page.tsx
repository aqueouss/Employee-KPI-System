import { requireRole } from "@/lib/auth/require-role";
import {
  getTodayDateString,
  parseDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { MonthNav } from "@/components/attendance/month-nav";
import { AttendanceCalendarGrid } from "@/components/attendance/attendance-calendar-grid";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EmployeeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const profile = await requireRole(["admin", "employee"]);
  const sp = await searchParams;
  const month =
    parseDateString(sp.month) !== null
      ? startOfMonthDateString(sp.month!)
      : startOfMonthDateString(getTodayDateString());

  const { monthStart, summary, weeks } = await loadMonthAttendance(
    profile.id,
    month,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Your leave balance and calendar for {monthStart.slice(0, 7)}.
          </p>
        </div>
        <MonthNav basePath="/employee/attendance" monthStart={monthStart} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          label="Paid leave"
          remaining={summary.paid_leave_remaining}
          total={summary.paid_leave}
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
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>
            Used this month: {summary.paid_leave_used} paid ·{" "}
            {summary.half_day_used} half · {summary.short_leave_used} short ·{" "}
            {summary.late_used} late
            {summary.penalty_half_days > 0
              ? ` · ${summary.penalty_half_days} extra late half-day(s)`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceCalendarGrid
            weeks={weeks}
            editable={false}
            monthLabel={monthStart.slice(0, 7)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceCard({
  label,
  remaining,
  total,
}: {
  label: string;
  remaining: number;
  total: number;
}) {
  const variant =
    remaining < 0 ? "destructive" : remaining === 0 ? "warning" : "success";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-baseline gap-2">
          <Badge variant={variant} className="text-base">
            {remaining}
          </Badge>
          <span className="text-sm font-normal text-muted-foreground">
            of {total} left
          </span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
