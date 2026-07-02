import Link from "next/link";
import { Users, AlertTriangle, Award, Gavel, ArrowRight } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, addDaysToDateString, parseDateString } from "@/lib/utils/dates";
import {
  groupEmployeesByDepartment,
  type DepartmentEmployee,
} from "@/lib/departments/department-utils";
import { getAdminDashboardCaption } from "@/lib/captions/funny-captions";
import { loadTodayAttendanceOverview } from "@/lib/attendance/today-overview";
import { DepartmentOverviewCard } from "@/components/admin/department-overview-card";
import { TodayAttendanceGrid } from "@/components/admin/today-attendance-grid";
import { FunnyCaption } from "@/components/ui/funny-caption";
import { DashboardDateBadge } from "@/components/layout/dashboard-date-badge";
import { FlagBadge } from "@/components/kpi/flag-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { KpiFlag } from "@/types/domain";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const sp = await searchParams;
  const today = getTodayDateString();
  const parsedDate = parseDateString(sp.date);
  const attendanceDate =
    parsedDate && parsedDate <= today ? parsedDate : today;
  const isAttendanceToday = attendanceDate === today;
  const yesterday = addDaysToDateString(today, -1);

  const [
    { count: employeeCount },
    { count: activeWarnings },
    { count: pendingRewards },
    { count: openReviews },
    { count: pendingApprovals },
    { count: openReminders },
    { data: latestSnapshots },
    { data: profileRows },
    todayAttendance,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("warnings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("status", "eligible"),
    supabase
      .from("termination_reviews")
      .select("id", { count: "exact", head: true })
      .in("status", ["eligible", "under_review"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("daily_kpi_snapshots")
      .select("flag")
      .eq("kpi_date", yesterday),
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, job_designation, department, is_active, role",
      )
      .order("full_name"),
    loadTodayAttendanceOverview(supabase, attendanceDate),
  ]);

  const flagCounts = (latestSnapshots ?? []).reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.flag] = (acc[s.flag] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const departments = groupEmployeesByDepartment(
    (profileRows ?? []) as DepartmentEmployee[],
  );

  const adminCaption = getAdminDashboardCaption({
    approvals: pendingApprovals ?? 0,
    reminders: openReminders ?? 0,
    warnings: activeWarnings ?? 0,
    rewards: pendingRewards ?? 0,
    reviews: openReviews ?? 0,
    seed: today,
  });

  const stats = [
    {
      label: "Employees",
      value: employeeCount ?? 0,
      href: "/admin/employees",
      icon: Users,
    },
    {
      label: "Active warnings",
      value: activeWarnings ?? 0,
      href: "/admin/warnings",
      icon: AlertTriangle,
    },
    {
      label: "Pending rewards",
      value: pendingRewards ?? 0,
      href: "/admin/rewards",
      icon: Award,
    },
    {
      label: "Open reviews",
      value: openReviews ?? 0,
      href: "/admin/termination-reviews",
      icon: Gavel,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Company-wide KPI, warnings, and rewards at a glance.
          </p>
        </div>
        <DashboardDateBadge date={today} />
      </div>

      <FunnyCaption>{adminCaption}</FunnyCaption>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{s.label}</CardDescription>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-3xl">{s.value}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center text-xs text-muted-foreground">
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <TodayAttendanceGrid
        date={attendanceDate}
        employees={todayAttendance.employees}
        counts={todayAttendance.counts}
        isToday={isAttendanceToday}
      />

      <Card>
        <CardHeader>
          <CardTitle>Yesterday&apos;s KPI flags</CardTitle>
          <CardDescription>
            Finalized snapshots for {yesterday}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(["green", "yellow", "red", "no_tasks"] as KpiFlag[]).map((f) => (
            <div key={f} className="flex items-center gap-2">
              <FlagBadge flag={f} />
              <span className="text-lg font-semibold">
                {flagCounts[f] ?? 0}
              </span>
            </div>
          ))}
          {(latestSnapshots ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No snapshots for yesterday yet. Run the daily KPI job.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Departments</h2>
            <p className="text-sm text-muted-foreground">
              Employees grouped by department
            </p>
          </div>
          <Link
            href="/admin/departments"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.slice(0, 6).map((department) => (
            <DepartmentOverviewCard key={department.slug} department={department} />
          ))}
        </div>
        {departments.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No departments yet. Assign departments when editing employees.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
