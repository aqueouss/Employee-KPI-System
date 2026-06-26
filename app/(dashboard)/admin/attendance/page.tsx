import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, startOfMonthDateString } from "@/lib/utils/dates";
import {
  computeLeaveBalance,
  type AttendanceRecordInput,
} from "@/services/attendance/attendance.engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/database.types";

export default async function AdminAttendancePage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const month = startOfMonthDateString(getTodayDateString());

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name");

  const list = (employees ?? []) as Pick<
    Tables<"profiles">,
    "id" | "full_name" | "email" | "role" | "is_active"
  >[];

  const summaries = await Promise.all(
    list.map(async (emp) => {
      const [{ data: records }, { data: balance }] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("*")
          .eq("employee_id", emp.id)
          .gte("attendance_date", month)
          .lte("attendance_date", `${month.slice(0, 7)}-31`),
        supabase
          .from("leave_balances")
          .select("*")
          .eq("employee_id", emp.id)
          .eq("month", month)
          .maybeSingle(),
      ]);

      const inputs = ((records ?? []) as Tables<"attendance_records">[]).map(
        (r): AttendanceRecordInput => ({
          attendance_date: r.attendance_date,
          status: r.status,
          short_leave_type: r.short_leave_type,
          is_auto_generated: r.is_auto_generated,
        }),
      );

      const allowances = balance
        ? {
            paid_leave: Number(balance.paid_leave_allowance),
            half_day: Number(balance.half_day_allowance),
            short_leave: Number(balance.short_leave_allowance),
            late: balance.late_allowance,
          }
        : undefined;

      const summary = computeLeaveBalance(inputs, month, allowances);
      return { emp, summary };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Mark attendance and manage leave balances. Office hours 10 AM – 6 PM.
          Sundays excluded; Saturday is a working day.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees — {month.slice(0, 7)}</CardTitle>
          <CardDescription>
            Monthly leave remaining (paid / half / short / late)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Paid leave</TableHead>
                <TableHead>Half day</TableHead>
                <TableHead>Short leave</TableHead>
                <TableHead>Lates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(({ emp, summary }) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>
                    <BalanceCell
                      remaining={summary.paid_leave_remaining}
                      allowance={summary.paid_leave}
                    />
                  </TableCell>
                  <TableCell>
                    <BalanceCell
                      remaining={summary.half_day_remaining}
                      allowance={summary.half_day}
                    />
                  </TableCell>
                  <TableCell>
                    <BalanceCell
                      remaining={summary.short_leave_remaining}
                      allowance={summary.short_leave}
                    />
                  </TableCell>
                  <TableCell>
                    <BalanceCell
                      remaining={summary.late_remaining}
                      allowance={summary.late}
                    />
                    {summary.penalty_half_days > 0 ? (
                      <span className="ml-1 text-xs text-amber-600">
                        +{summary.penalty_half_days} half
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/attendance/${emp.id}?month=${month}`}>
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Manage
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceCell({
  remaining,
  allowance,
}: {
  remaining: number;
  allowance: number;
}) {
  const variant =
    remaining < 0 ? "destructive" : remaining === 0 ? "warning" : "success";
  return (
    <Badge variant={variant}>
      {remaining} / {allowance}
    </Badge>
  );
}
