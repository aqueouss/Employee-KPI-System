import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import {
  getTodayDateString,
  parseDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { MonthNav } from "@/components/attendance/month-nav";
import { AttendanceCalendarGrid } from "@/components/attendance/attendance-calendar-grid";
import { LeaveBalanceCards } from "@/components/attendance/leave-balance-cards";
import { SalarySummaryCards } from "@/components/attendance/salary-summary-cards";
import { Button } from "@/components/ui/button";
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

  const { monthStart, summary, salarySummary, weeks } = await loadMonthAttendance(
    profile.id,
    month,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Remaining leave balance for {monthStart.slice(0, 7)}. Unused paid
            leave carries to the next month.
          </p>
        </div>
        <MonthNav basePath="/employee/attendance" monthStart={monthStart} />
      </div>

      <LeaveBalanceCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Salary</CardTitle>
          <CardDescription>
            Salaried days = working days − absent days − extra half days (0.5
            each).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalarySummaryCards summary={salarySummary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>
            Used this month: {summary.paid_leave_used} paid ·{" "}
            {summary.half_day_used} half · {summary.short_leave_used} short ·{" "}
            {summary.late_used} late
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
