import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { addDaysToDateString, getTodayDateString } from "@/lib/utils/dates";
import {
  aggregateDepartmentPerformance,
  groupEmployeesByDepartment,
  slugToDepartment,
  type DepartmentEmployee,
} from "@/lib/departments/department-utils";
import { DepartmentFlagSummary } from "@/components/admin/department-overview-card";
import { FlagBadge } from "@/components/kpi/flag-badge";
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

export default async function AdminDepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireRole(["admin"]);
  const { slug } = await params;
  const departmentName = slugToDepartment(slug);
  const supabase = await createClient();
  const today = getTodayDateString();
  const fromDate = addDaysToDateString(today, -29);

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, job_designation, department, is_active, role",
    )
    .order("full_name");

  const employees = (data ?? []) as DepartmentEmployee[];
  const departments = groupEmployeesByDepartment(employees);
  const department = departments.find((d) => d.slug === slug);

  if (!department) notFound();

  const employeeIds = department.employees.map((e) => e.id);
  const { data: snapshotData } =
    employeeIds.length > 0
      ? await supabase
          .from("daily_kpi_snapshots")
          .select("employee_id, flag, completion_pct")
          .in("employee_id", employeeIds)
          .gte("kpi_date", fromDate)
          .lte("kpi_date", today)
      : { data: [] };

  const snapshots = (snapshotData ?? []) as Pick<
    Tables<"daily_kpi_snapshots">,
    "employee_id" | "flag" | "completion_pct"
  >[];

  const performance = aggregateDepartmentPerformance(department, snapshots);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/departments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to departments
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {departmentName}
            </h1>
            <p className="text-muted-foreground">
              {performance.activeCount} active · {performance.employeeCount}{" "}
              employees · last 30 days KPI
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department performance</CardTitle>
          <CardDescription>
            KPI flags and completion across all members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentFlagSummary
            flagCounts={performance.flagCounts}
            avgCompletionPct={performance.avgCompletionPct}
            snapshotDays={performance.snapshotDays}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Individual KPI breakdown</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avg completion</TableHead>
                <TableHead className="text-right">Flags (30d)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.employeeStats.map(
                ({ employee, flagCounts, avgCompletionPct, snapshotDays }) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/employees/${employee.id}`}
                        className="hover:underline"
                      >
                        {employee.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.job_designation || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.is_active ? "success" : "destructive"}
                      >
                        {employee.is_active ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {snapshotDays > 0 ? `${avgCompletionPct}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {(["green", "yellow", "red", "no_tasks"] as const).map(
                          (flag) =>
                            flagCounts[flag] ? (
                              <span key={flag} className="inline-flex items-center gap-1 text-xs">
                                <FlagBadge flag={flag} />
                                {flagCounts[flag]}
                              </span>
                            ) : null,
                        )}
                        {snapshotDays === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No data
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
