import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, addDaysToDateString } from "@/lib/utils/dates";
import { KpiFlagGrid } from "@/components/kpi/kpi-flag-grid";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskItem } from "@/components/tasks/task-item";
import { Badge } from "@/components/ui/badge";
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
  const profile = await requireRole(["admin", "employee"]);
  const today = getTodayDateString();

  const supabase = await createClient();
  const [{ data }, { data: snapshotRows }] = await Promise.all([
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
  ]);

  const flagSnapshots = (snapshotRows ?? []) as Pick<
    Tables<"daily_kpi_snapshots">,
    "kpi_date" | "flag"
  >[];

  const tasks = (data ?? []) as Tables<"tasks">[];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const submitted = tasks.filter((t) => t.status === "submitted").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const flagVariant =
    total === 0
      ? "secondary"
      : pct >= 90
        ? "success"
        : pct >= 70
          ? "warning"
          : "destructive";
  const flagLabel =
    total === 0
      ? "No tasks"
      : pct >= 90
        ? "Green"
        : pct >= 70
          ? "Yellow"
          : "Red";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your day at a glance.
        </p>
      </div>

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
              <Badge variant={flagVariant}>{flagLabel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Only admin-approved tasks count toward your KPI.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
          <CardDescription>Your daily KPI flags</CardDescription>
        </CardHeader>
        <CardContent>
          <KpiFlagGrid snapshots={flagSnapshots} endDate={today} days={30} />
        </CardContent>
      </Card>

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
    </div>
  );
}
