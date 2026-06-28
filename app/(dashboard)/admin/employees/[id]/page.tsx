import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel } from "@/lib/utils/dates";
import { AdminTaskCreateForm } from "@/components/admin/admin-task-create-form";
import { AdminTaskListItem } from "@/components/admin/admin-task-list-item";
import { EmployeeDetailsForm } from "@/components/admin/employee-details-form";
import { FlagBadge } from "@/components/kpi/flag-badge";
import { KpiFlagGrid } from "@/components/kpi/kpi-flag-grid";
import { getTodayDateString } from "@/lib/utils/dates";
import { RewardStatusBadge } from "@/components/rewards/reward-status-badge";
import {
  ReviewStatusBadge,
  WarningStatusBadge,
} from "@/components/warnings/warning-status-badge";
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

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const [
    { data: snapshotData },
    { data: warningData },
    { data: rewardData },
    { data: taskData },
  ] = await Promise.all([
    supabase
      .from("daily_kpi_snapshots")
      .select("*")
      .eq("employee_id", id)
      .order("kpi_date", { ascending: false })
      .limit(30),
    supabase
      .from("warnings")
      .select("*")
      .eq("employee_id", id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("rewards")
      .select("*")
      .eq("employee_id", id)
      .order("eligible_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("employee_id", id)
      .order("task_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const snapshots = (snapshotData ?? []) as Tables<"daily_kpi_snapshots">[];
  const warnings = (warningData ?? []) as Tables<"warnings">[];
  const rewards = (rewardData ?? []) as Tables<"rewards">[];
  const tasks = (taskData ?? []) as Tables<"tasks">[];
  const today = getTodayDateString();

  const flagCounts = snapshots.reduce<Record<string, number>>((acc, s) => {
    acc[s.flag] = (acc[s.flag] ?? 0) + 1;
    return acc;
  }, {});

  const flagSnapshots = snapshots.map((s) => ({
    kpi_date: s.kpi_date,
    flag: s.flag,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to employees
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile.full_name}
          </h1>
          <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
            {profile.role}
          </Badge>
          <Badge variant={profile.is_active ? "success" : "destructive"}>
            {profile.is_active ? "active" : "inactive"}
          </Badge>
        </div>
        <p className="text-muted-foreground">{profile.email}</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            Department:{" "}
            <span className="text-foreground">
              {profile.department || "—"}
            </span>
          </span>
          <span>
            Designation:{" "}
            <span className="text-foreground">
              {profile.job_designation || "—"}
            </span>
          </span>
          <span>
            Hire date:{" "}
            <span className="text-foreground">
              {profile.hire_date ? formatDateLabel(profile.hire_date) : "—"}
            </span>
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee details</CardTitle>
          <CardDescription>
            Job designation, department, and hire date (admin only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeDetailsForm
            employeeId={profile.id}
            hireDate={profile.hire_date}
            jobDesignation={profile.job_designation}
            department={profile.department}
            monthlySalary={
              profile.monthly_salary != null ? Number(profile.monthly_salary) : null
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Termination status</CardDescription>
            <CardTitle>
              <ReviewStatusBadge status={profile.termination_review_status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-2xl">{warnings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rewards</CardDescription>
            <CardTitle className="text-2xl">{rewards.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flags (last 30)</CardDescription>
            <CardTitle className="flex flex-wrap gap-1 pt-1">
              {(["green", "yellow", "red", "no_tasks"] as const).map((f) =>
                flagCounts[f] ? (
                  <span key={f} className="text-xs">
                    <FlagBadge flag={f} /> {flagCounts[f]}
                  </span>
                ) : null,
              )}
              {snapshots.length === 0 ? (
                <span className="text-sm text-muted-foreground">None</span>
              ) : null}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KPI history</CardTitle>
          <CardDescription>Last 30 finalized days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-b border-border/60 px-6 py-5">
            <KpiFlagGrid
              snapshots={flagSnapshots}
              endDate={today}
              days={30}
            />
          </div>
          {snapshots.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No snapshots yet.
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

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            Most recent 50 tasks. Approve pending tasks anytime — KPI for that
            day updates when you approve, even on a later date. You can approve
            pending tasks directly or revoke a previously approved task.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminTaskCreateForm employeeId={id} today={today} />
          {tasks.length === 0 ? (
            <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No tasks yet.
            </div>
          ) : (
            <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
              {tasks.map((task) => (
                <AdminTaskListItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {warnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No warnings.</p>
            ) : (
              warnings.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {w.warning_month.slice(0, 7)} · {w.red_flag_dates.length} red
                    days
                  </span>
                  <WarningStatusBadge status={w.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rewards.</p>
            ) : (
              rewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {formatDateLabel(r.streak_start_date)} –{" "}
                    {formatDateLabel(r.streak_end_date)}
                  </span>
                  <RewardStatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
