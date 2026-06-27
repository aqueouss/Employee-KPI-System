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
import { LeaveBalanceCards } from "@/components/attendance/leave-balance-cards";
import { LeaveBalanceForm } from "@/components/admin/leave-balance-form";
import { OvertimeForm } from "@/components/admin/overtime-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

      <LeaveBalanceCards summary={summary} />

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
          <CardTitle>Overtime — {monthStart.slice(0, 7)}</CardTitle>
          <CardDescription>
            Add month-end overtime hours (8h = 1 paid leave day). Credits carry
            forward with unused leave.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OvertimeForm
            employeeId={employeeId}
            month={monthStart}
            balance={balanceRow}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly allowances — {monthStart.slice(0, 7)}</CardTitle>
          <CardDescription>
            Base paid leave for this month (unused paid leave carries forward
            automatically).
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
