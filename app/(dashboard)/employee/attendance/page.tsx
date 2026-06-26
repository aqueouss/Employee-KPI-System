import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, startOfMonthDateString } from "@/lib/utils/dates";
import {
  computeLeaveBalance,
  type AttendanceRecordInput,
} from "@/services/attendance/attendance.engine";
import { AttendanceRecordsTable } from "@/components/admin/attendance-records-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function EmployeeAttendancePage() {
  const profile = await requireRole(["admin", "employee"]);
  const month = startOfMonthDateString(getTodayDateString());
  const supabase = await createClient();

  const [{ data: records }, { data: balance }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", profile.id)
      .gte("attendance_date", month)
      .lte("attendance_date", `${month.slice(0, 7)}-31`)
      .order("attendance_date", { ascending: false }),
    supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", profile.id)
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
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Your leave balance and attendance for {month.slice(0, 7)}. Office 10
          AM – 6 PM, Sunday closed.
        </p>
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
          label="Lates allowed"
          remaining={summary.late_remaining}
          total={summary.late}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This month</CardTitle>
          <CardDescription>
            Used: {summary.paid_leave_used} paid, {summary.half_day_used} half
            (incl. {summary.penalty_half_days} from extra lates),{" "}
            {summary.short_leave_used} short, {summary.late_used} late
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AttendanceRecordsTable
            employeeId={profile.id}
            records={recordRows}
            canEdit={false}
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
