import { requireRole } from "@/lib/auth/require-role";
import {
  getTodayDateString,
  parseDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { getAttendanceCaption } from "@/lib/captions/funny-captions";
import { FunnyCaption } from "@/components/ui/funny-caption";
import { MonthNav } from "@/components/attendance/month-nav";
import { AttendanceCalendarGrid } from "@/components/attendance/attendance-calendar-grid";
import { LeaveBalanceCards } from "@/components/attendance/leave-balance-cards";
import { PayrollSummaryCards } from "@/components/attendance/payroll-summary-cards";
import { DownloadPayslipButton } from "@/components/payroll/download-payslip-button";
import { formatMonthLabel } from "@/lib/payroll/format-month-label";
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

  const { monthStart, summary, payrollSummary, payrollRow, weeks } =
    await loadMonthAttendance(profile.id, month);

  const attendanceCaption = getAttendanceCaption({
    date: getTodayDateString(),
    paidLeaveRemaining: summary.paid_leave_remaining,
    paidLeaveUsed: summary.paid_leave_used,
    lateUsed: summary.late_used,
    seed: `${profile.id}-${monthStart}`,
  });

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

      <FunnyCaption>{attendanceCaption}</FunnyCaption>

      <LeaveBalanceCards summary={summary} />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Payroll</CardTitle>
            <CardDescription>
              Net salary = attendance salary + incentives + conveyance − advance
              deduction.
            </CardDescription>
          </div>
          <DownloadPayslipButton
            allowDownload={false}
            data={{
              employeeName: profile.full_name,
              employeeEmail: profile.email,
              designation: profile.job_designation,
              department: profile.department,
              monthLabel: formatMonthLabel(monthStart),
              monthStart,
              payroll: payrollSummary,
              notes: payrollRow?.notes ?? null,
            }}
          />
        </CardHeader>
        <CardContent>
          <PayrollSummaryCards summary={payrollSummary} />
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
