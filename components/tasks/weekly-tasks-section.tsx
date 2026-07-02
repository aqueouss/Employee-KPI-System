import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
import {
  formatDateLabel,
  isTaskEditableNow,
  isTaskWithinDeadline,
  periodLabel,
  taskDeadline,
} from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

function isActiveAdminWeeklyTask(
  task: Tables<"tasks">,
  today: string,
): boolean {
  if (task.period !== "weekly" || !task.created_by_admin) return false;
  const deadline = taskDeadline("weekly", task.task_date, task.due_date);
  if (task.status === "completed") return deadline >= today;
  return isTaskWithinDeadline("weekly", task.task_date, today, task.due_date);
}

export function WeeklyTasksSection({
  tasks,
  today,
}: {
  tasks: Tables<"tasks">[];
  today: string;
}) {
  const weeklyTasks = tasks
    .filter((task) => isActiveAdminWeeklyTask(task, today))
    .filter(
      (task) => task.status === "pending" || task.status === "submitted",
    )
    .sort((a, b) => {
      const deadlineA = taskDeadline("weekly", a.task_date, a.due_date);
      const deadlineB = taskDeadline("weekly", b.task_date, b.due_date);
      return deadlineA.localeCompare(deadlineB);
    });

  if (weeklyTasks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly tasks</CardTitle>
            <CardDescription>
              Admin-assigned tasks due 7 days after assignment
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/employee/tasks">
              All tasks
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {weeklyTasks.map((task) => (
          <div key={task.id} className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
              <Badge variant="outline">Weekly</Badge>
              <span>{periodLabel("weekly", task.task_date, task.due_date)}</span>
              <span>
                · Due{" "}
                {formatDateLabel(
                  taskDeadline("weekly", task.task_date, task.due_date),
                )}
              </span>
            </div>
            <TaskItem
              task={task}
              editable={isTaskEditableNow(
                task.period,
                task.task_date,
                today,
                task.due_date,
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
