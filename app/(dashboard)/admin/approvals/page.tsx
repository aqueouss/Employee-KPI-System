import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, periodLabel } from "@/lib/utils/dates";
import { TaskReviewControls } from "@/components/admin/task-review-controls";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function AdminApprovalsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: taskData } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  const tasks = (taskData ?? []) as Tables<"tasks">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name");
  const nameById = new Map((profileData ?? []).map((p) => [p.id, p.full_name]));

  // Group submitted tasks by employee for a tidier review queue.
  const byEmployee = new Map<string, Tables<"tasks">[]>();
  for (const task of tasks) {
    const list = byEmployee.get(task.employee_id) ?? [];
    list.push(task);
    byEmployee.set(task.employee_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Task Approvals
        </h1>
        <p className="text-muted-foreground">
          Review tasks employees marked as done, or approve pending tasks
          directly. You can approve anytime — even days later — and the KPI for
          that task&apos;s date will update. You can also revoke a previously
          approved task.
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing awaiting approval. You&apos;re all caught up.
          </CardContent>
        </Card>
      ) : (
        Array.from(byEmployee.entries()).map(([employeeId, employeeTasks]) => (
          <Card key={employeeId}>
            <CardHeader>
              <CardTitle className="text-base">
                <Link
                  href={`/admin/employees/${employeeId}`}
                  className="hover:underline"
                >
                  {nameById.get(employeeId) ?? "Unknown employee"}
                </Link>
              </CardTitle>
              <CardDescription>
                {employeeTasks.length} task
                {employeeTasks.length === 1 ? "" : "s"} awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {employeeTasks.map((task) => (
                <div
                  key={task.id}
                  className="space-y-3 rounded-md border px-4 py-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">
                        {task.title}
                      </p>
                      {task.period !== "daily" ? (
                        <Badge
                          variant="outline"
                          className="shrink-0 capitalize"
                        >
                          {task.period}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="break-words text-xs text-muted-foreground">
                      {task.period === "daily"
                        ? formatDateLabel(task.task_date)
                        : periodLabel(
                            task.period,
                            task.task_date,
                            task.due_date,
                          )}
                      {task.submitted_at
                        ? ` · submitted ${new Date(task.submitted_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <TaskReviewControls taskId={task.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
