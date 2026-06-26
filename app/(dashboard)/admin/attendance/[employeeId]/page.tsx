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
import {
  computeLeaveBalance,
  type AttendanceRecordInput,
} from "@/services/attendance/attendance.engine";
import { AttendanceMarkForm } from "@/components/admin/attendance-mark-form";
import { AttendanceRecordsTable } from "@/components/admin/attendance-records-table";
import { LeaveBalanceForm } from "@/components/admin/leave-balance-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database.types";

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

  const [{ data: records }, { data: balance }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("attendance_date", month)
      .lte("attendance_date", `${month.slice(0, 7)}-31`)
      .order("attendance_date", { ascending: false }),
    supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("month", month)
      .maybeSingle(),
  ]);

  const recordRows = (records ?? []) as Tables<"attendance_records">[];
  const balanceRow = balance as Tables<"leave_balances"> | null;

  const inputs = recordRows.map(
    (r): AttendanceRecordInput => ({
      attendance_date: r.attendance_date,
      status: r.status,
      short_leave_type: r.short_leave_type,
      is_auto_generated: r.is_auto_generated,
    }),
  );

  const allowances = balanceRow
    ? {
        paid_leave: Number(balanceRow.paid_leave_allowance),
        half_day: Number(balanceRow.half_day_allowance),
        short_leave: Number(balanceRow.short_leave_allowance),
        late: balanceRow.late_allowance,
      }
    : undefined;

  const summary = computeLeaveBalance(inputs, month, allowances);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/attendance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to attendance
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.full_name} — Attendance
        </h1>
        <p className="text-muted-foreground">{profile.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paid leave left" value={`${summary.paid_leave_remaining} / ${summary.paid_leave}`} />
        <StatCard label="Half day left" value={`${summary.half_day_remaining} / ${summary.half_day}`} />
        <StatCard label="Short leave left" value={`${summary.short_leave_remaining} / ${summary.short_leave}`} />
        <StatCard label="Lates left" value={`${summary.late_remaining} / ${summary.late}`} />
      </div>

      {summary.penalty_half_days > 0 ? (
        <p className="text-sm text-amber-600">
          {summary.penalty_half_days} extra late(s) counted as half day(s) this
          month.
        </p>
      ) : null}
      {summary.sunday_leaves > 0 ? (
        <p className="text-sm text-muted-foreground">
          {summary.sunday_leaves} Sunday leave(s) applied (weekly &gt;2 leave
          rule).
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Leave balance — {month.slice(0, 7)}</CardTitle>
          <CardDescription>
            Set monthly allowances or initial balance for this employee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveBalanceForm
            employeeId={employeeId}
            month={month}
            balance={balanceRow}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mark attendance</CardTitle>
          <CardDescription>
            Short leave: arrive 11:30 AM or leave 4:30 PM. Office 10 AM – 6 PM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceMarkForm
            employeeId={employeeId}
            defaultDate={getTodayDateString()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records — {month.slice(0, 7)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AttendanceRecordsTable
            employeeId={employeeId}
            records={recordRows}
            canEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
