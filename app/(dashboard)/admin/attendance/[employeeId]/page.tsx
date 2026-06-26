import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  getTodayDateString,
  parseDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { MonthNav } from "@/components/attendance/month-nav";
import { AttendanceCalendarGrid } from "@/components/attendance/attendance-calendar-grid";
import { LeaveBalanceForm } from "@/components/admin/leave-balance-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminEmployeeAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  await requireRole(["admin"]);
  const { employeeId } = await params;
  const sp = await searchParams;
  const month =
    parseDateString(sp.month) !== null
      ? startOfMonthDateString(sp.month!)
      : startOfMonthDateString(getTodayDateString());

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", employeeId)
    .single();

  if (!profile) notFound();

  const { monthStart, summary, weeks, balanceRow } =
    await loadMonthAttendance(employeeId, month);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/attendance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to attendance
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.full_name} — Attendance
            </h1>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
          <MonthNav
            basePath={`/admin/attendance/${employeeId}`}
            monthStart={monthStart}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Paid leave left"
          remaining={summary.paid_leave_remaining}
          total={summary.paid_leave}
        />
        <StatCard
          label="Half day left"
          remaining={summary.half_day_remaining}
          total={summary.half_day}
        />
        <StatCard
          label="Short leave left"
          remaining={summary.short_leave_remaining}
          total={summary.short_leave}
        />
        <StatCard
          label="Lates left"
          remaining={summary.late_remaining}
          total={summary.late}
          extra={
            summary.penalty_half_days > 0
              ? `+${summary.penalty_half_days} half from extra lates`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar — {monthStart.slice(0, 7)}</CardTitle>
          <CardDescription>
            Click a day to mark or change attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceCalendarGrid
            weeks={weeks}
            editable
            employeeId={employeeId}
            monthLabel={monthStart.slice(0, 7)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly allowances — {monthStart.slice(0, 7)}</CardTitle>
          <CardDescription>
            Set starting allowances for this month. Remaining balances above
            update automatically when you mark attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveBalanceForm
            employeeId={employeeId}
            month={monthStart}
            balance={balanceRow}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  remaining,
  total,
  extra,
}: {
  label: string;
  remaining: number;
  total: number;
  extra?: string;
}) {
  const variant =
    remaining < 0 ? "destructive" : remaining === 0 ? "warning" : "success";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-baseline gap-2">
          <Badge variant={variant} className="text-lg">
            {remaining}
          </Badge>
          <span className="text-sm font-normal text-muted-foreground">
            of {total}
          </span>
        </CardTitle>
        {extra ? (
          <p className="text-xs text-amber-600">{extra}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
