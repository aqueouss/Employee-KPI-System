import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { requireKpiEmployee } from "@/lib/auth/require-kpi-employee";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, addDaysToDateString, startOfMonthDateString } from "@/lib/utils/dates";
import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { applyWeeklyRedFlagsToSnapshots } from "@/lib/kpi/weekly-red-flags";
import { syncWeeklyOverdueSnapshotsForEmployee } from "@/lib/kpi/sync-weekly-overdue-snapshots";
import { computeDailyKpi } from "@/services/kpi/kpi.engine";
import { loadEmployeeWeeklyIncompleteRedFlagDates } from "@/services/kpi/weekly.service";
import {
  getEmployeeDashboardCaption,
  getRankingCaption,
} from "@/lib/captions/funny-captions";
import { FunnyCaption } from "@/components/ui/funny-caption";
import { DashboardDateBadge } from "@/components/layout/dashboard-date-badge";
import { LeaveBalanceCards } from "@/components/attendance/leave-balance-cards";
import { FlagBadge } from "@/components/kpi/flag-badge";
import { KpiFlagGrid } from "@/components/kpi/kpi-flag-grid";
import { OpenTasksSection } from "@/components/tasks/open-tasks-section";
import { WeeklyTasksSection } from "@/components/tasks/weekly-tasks-section";
import { SuggestionsCard } from "@/components/tasks/suggestions-card";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskItem } from "@/components/tasks/task-item";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function EmployeeDashboardPage() {
  const profile = await requireKpiEmployee();
  const today = getTodayDateString();
  const monthStart = startOfMonthDateString(today);

  const supabase = await createClient();
  await syncWeeklyOverdueSnapshotsForEmployee(profile.id);

  const [{ data }, { data: snapshotRows }, { data: suggestionRows }, { data: openTaskRows }, { data: weeklyTaskRows }, attendanceData, { data: rankingData }, { data: rules }, { data: todayAttendance }, weeklyRedFlagDates] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("employee_id", profile.id)
        .eq("task_date", today)
        .eq("period", "daily")
        .order("created_at", { ascending: true }),
      supabase
        .from("daily_kpi_snapshots")
        .select("kpi_date, flag")
        .eq("employee_id", profile.id)
        .gte("kpi_date", addDaysToDateString(today, -29))
        .lte("kpi_date", today)
        .order("kpi_date", { ascending: true }),
      supabase
        .from("task_suggestions")
        .select("id, title")
        .eq("employee_id", profile.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("*")
        .eq("employee_id", profile.id)
        .in("status", ["pending", "submitted"])
        .order("task_date", { ascending: true }),
      supabase
        .from("tasks")
        .select("*")
        .eq("employee_id", profile.id)
        .eq("period", "weekly")
        .eq("created_by_admin", true)
        .order("created_at", { ascending: true }),
      loadMonthAttendance(profile.id, monthStart),
      supabase.rpc("get_employee_rankings", {
        p_start: monthStart,
        p_end: today,
      }),
      supabase
        .from("kpi_rules")
        .select("green_threshold, yellow_threshold")
        .eq("id", 1)
        .single(),
      supabase
        .from("attendance_records")
        .select("status")
        .eq("employee_id", profile.id)
        .eq("attendance_date", today)
        .maybeSingle(),
      loadEmployeeWeeklyIncompleteRedFlagDates(supabase, profile.id, today),
    ]);

  const openTaskCandidates = (openTaskRows ?? []) as Tables<"tasks">[];
  const weeklyTasks = (weeklyTaskRows ?? []) as Tables<"tasks">[];

  const suggestions = (suggestionRows ?? []) as {
    id: string;
    title: string;
  }[];

  const flagSnapshots = applyWeeklyRedFlagsToSnapshots(
    (snapshotRows ?? []) as Pick<
      Tables<"daily_kpi_snapshots">,
      "kpi_date" | "flag"
    >[],
    weeklyRedFlagDates,
  );

  const tasks = (data ?? []) as Tables<"tasks">[];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const submitted = tasks.filter((t) => t.status === "submitted").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const liveKpi = computeDailyKpi(total, completed, {
    green_threshold: rules?.green_threshold ?? 90,
    yellow_threshold: rules?.yellow_threshold ?? 70,
  }, {
    attendanceStatus: todayAttendance?.status ?? null,
  });

  const rankings = (rankingData ?? []) as Array<{
    employee_id: string;
    full_name: string;
    avg_completion: number;
    days_tracked: number;
  }>;
  const dashboardCaption = getEmployeeDashboardCaption({
    todayCompletionPct: pct,
    rankingCaption: getRankingCaption(rankings, profile.id, profile.full_name),
    seed: `${profile.id}-${today}`,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your day at a glance.
            {profile.department || profile.job_designation ? (
              <>
                {" "}
                ·{" "}
                {[profile.department, profile.job_designation]
                  .filter(Boolean)
                  .join(" · ")}
              </>
            ) : null}
          </p>
        </div>
        <DashboardDateBadge date={today} />
      </div>

      <FunnyCaption>{dashboardCaption}</FunnyCaption>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s completion</CardDescription>
            <CardTitle className="text-3xl">{pct}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl">
              {completed}
              <span className="text-lg text-muted-foreground"> / {total}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {submitted > 0
              ? `${submitted} awaiting admin approval`
              : `${total - completed} remaining`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Live flag (preview)</CardDescription>
            <CardTitle>
              <FlagBadge flag={liveKpi.flag} />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Only admin-approved tasks count toward your KPI.
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Leave balance — {monthStart.slice(0, 7)}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/employee/attendance">
              View attendance
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <LeaveBalanceCards summary={attendanceData.summary} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
          <CardDescription>Your daily KPI flags</CardDescription>
        </CardHeader>
        <CardContent>
          <KpiFlagGrid
            snapshots={flagSnapshots}
            endDate={today}
            days={30}
            weeklyRedFlagDates={weeklyRedFlagDates}
          />
        </CardContent>
      </Card>

      <WeeklyTasksSection tasks={weeklyTasks} today={today} />

      <SuggestionsCard suggestions={suggestions} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today&apos;s tasks</CardTitle>
              <CardDescription>
                Tick a task to submit it for admin approval
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/employee/tasks">
                Manage
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TaskCreateForm taskDate={today} />
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                No tasks yet. Add your first task above.
              </div>
            ) : (
              tasks.map((task) => (
                <TaskItem key={task.id} task={task} editable />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <OpenTasksSection tasks={openTaskCandidates} today={today} />
    </div>
  );
}
