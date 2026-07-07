import Link from "next/link";

import { CalendarCheck } from "lucide-react";



import { requireRole } from "@/lib/auth/require-role";

import { createClient } from "@/lib/supabase/server";

import {

  getTodayDateString,

  parseDateString,

  startOfMonthDateString,

} from "@/lib/utils/dates";

import { loadMonthAttendance } from "@/lib/attendance/month-data";

import { formatMonthLabel } from "@/lib/payroll/format-month-label";

import { getAdminAttendanceCaption } from "@/lib/captions/funny-captions";

import { MonthlyAttendanceExportButtons } from "@/components/admin/monthly-report-export-buttons";

import { MonthNav } from "@/components/attendance/month-nav";

import { FunnyCaption } from "@/components/ui/funny-caption";

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



export default async function AdminAttendancePage({

  searchParams,

}: {

  searchParams: Promise<{ month?: string }>;

}) {

  await requireRole(["admin"]);

  const sp = await searchParams;

  const month =

    parseDateString(sp.month) !== null

      ? startOfMonthDateString(sp.month!)

      : startOfMonthDateString(getTodayDateString());



  const supabase = await createClient();



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

      const { summary } = await loadMonthAttendance(emp.id, month);

      return { emp, summary };

    }),

  );



  const adminAttendanceCaption = getAdminAttendanceCaption(month);



  return (

    <div className="space-y-6">

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div>

          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>

          <p className="text-muted-foreground">

            {formatMonthLabel(month)} — mark attendance or export the monthly

            sheet.

          </p>

        </div>

        <div className="flex flex-wrap items-center gap-3">

          <MonthNav basePath="/admin/attendance" monthStart={month} />

          <MonthlyAttendanceExportButtons monthStart={month} />

          <Button asChild>

            <Link href="/admin/attendance/today">

              <CalendarCheck className="mr-2 h-4 w-4" />

              Mark today

            </Link>

          </Button>

        </div>

      </div>



      <FunnyCaption>{adminAttendanceCaption}</FunnyCaption>



      <Card>

        <CardHeader>

          <CardTitle>Employees — {month.slice(0, 7)}</CardTitle>

          <CardDescription>

            Remaining balance (left / allowance)

          </CardDescription>

        </CardHeader>

        <CardContent className="overflow-x-auto p-0">

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

                      note={

                        summary.paid_leave_carried_forward > 0

                          ? `+${summary.paid_leave_carried_forward} carried`

                          : undefined

                      }

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

  note,

}: {

  remaining: number;

  allowance: number;

  note?: string;

}) {

  const variant =

    remaining < 0 ? "destructive" : remaining === 0 ? "warning" : "success";

  return (

    <div className="flex flex-col items-start gap-0.5">

      <Badge variant={variant}>

        {remaining} / {allowance}

      </Badge>

      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}

    </div>

  );

}


