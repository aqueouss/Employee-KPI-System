import { requireKpiEmployee } from "@/lib/auth/require-kpi-employee";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, formatDateLabel } from "@/lib/utils/dates";
import { computeDailyKpi } from "@/services/kpi/kpi.engine";
import { getKpiCaption } from "@/lib/captions/funny-captions";
import { FunnyCaption } from "@/components/ui/funny-caption";
import { FlagBadge } from "@/components/kpi/flag-badge";
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
import type { KpiFlag } from "@/types/domain";

export default async function EmployeeKpiPage() {
  const profile = await requireKpiEmployee();
  const today = getTodayDateString();
  const supabase = await createClient();

  // Live preview for today (tasks not yet finalized by cron)
  const { data: todayTasks } = await supabase
    .from("tasks")
    .select("status")
    .eq("employee_id", profile.id)
    .eq("task_date", today);

  const [{ data: rules }, { data: todayAttendance }] = await Promise.all([
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
  ]);

  const total = todayTasks?.length ?? 0;
  const completed =
    todayTasks?.filter((t) => t.status === "completed").length ?? 0;
  const live = computeDailyKpi(total, completed, {
    green_threshold: rules?.green_threshold ?? 90,
    yellow_threshold: rules?.yellow_threshold ?? 70,
  }, {
    attendanceStatus: todayAttendance?.status ?? null,
  });

  // History: last 30 finalized snapshots
  const { data: snapshotData } = await supabase
    .from("daily_kpi_snapshots")
    .select("*")
    .eq("employee_id", profile.id)
    .order("kpi_date", { ascending: false })
    .limit(30);

  const snapshots = (snapshotData ?? []) as Tables<"daily_kpi_snapshots">[];

  const last7 = snapshots.slice(0, 7);
  const flagCounts = last7.reduce<Record<string, number>>((acc, s) => {
    acc[s.flag] = (acc[s.flag] ?? 0) + 1;
    return acc;
  }, {});

  const kpiCaption = getKpiCaption({
    livePct: live.completionPct,
    greenDaysLast7: flagCounts.green ?? 0,
    seed: `${profile.id}-${today}`,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">KPI</h1>
        <p className="text-muted-foreground">
          Your daily completion performance and flag history.
          {profile.department ? ` · ${profile.department}` : ""}
        </p>
      </div>

      <FunnyCaption>{kpiCaption}</FunnyCaption>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today (live)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              {live.completionPct}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FlagBadge flag={live.flag} />
            <p className="mt-2 text-xs text-muted-foreground">
              {completed} of {total} tasks · finalized nightly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 finalized days</CardDescription>
            <CardTitle className="text-3xl">{last7.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {(["green", "yellow", "red", "no_tasks"] as KpiFlag[]).map((f) =>
              flagCounts[f] ? (
                <span key={f} className="flex items-center gap-1 text-xs">
                  <FlagBadge flag={f} />
                  {flagCounts[f]}
                </span>
              ) : null,
            )}
            {last7.length === 0 ? (
              <span className="text-sm text-muted-foreground">No data yet</span>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Thresholds</CardDescription>
            <CardTitle className="text-base font-medium">
              Green ≥ {rules?.green_threshold ?? 90}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Yellow ≥ {rules?.yellow_threshold ?? 70}% · Red below that
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Last 30 finalized days</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {snapshots.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No finalized snapshots yet. These are generated by the daily KPI
              job.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead className="text-right">Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {formatDateLabel(s.kpi_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.completed_tasks} / {s.total_tasks}
                    </TableCell>
                    <TableCell>{s.completion_pct}%</TableCell>
                    <TableCell className="text-right">
                      <FlagBadge flag={s.flag} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
