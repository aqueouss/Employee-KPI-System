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
  isOpenTask,
  isTaskEditableNow,
  periodLabel,
  taskDeadline,
} from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

export function OpenTasksSection({
  tasks,
  today,
}: {
  tasks: Tables<"tasks">[];
  today: string;
}) {
  const openTasks = tasks
    .filter((task) =>
      isOpenTask(task.status, task.period, task.task_date, today, task.due_date),
    )
    .filter(
      (task) => !(task.period === "daily" && task.task_date === today),
    )
    .sort((a, b) => {
      const deadlineA = taskDeadline(a.period, a.task_date, a.due_date);
      const deadlineB = taskDeadline(b.period, b.task_date, b.due_date);
      return deadlineA.localeCompare(deadlineB);
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Open tasks</CardTitle>
            <CardDescription>
              Pending and awaiting-approval tasks until their deadline
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
        {openTasks.length === 0 ? (
          <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            No other open tasks right now.
          </div>
        ) : (
          openTasks.map((task) => (
            <div key={task.id} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
                {task.period !== "daily" ? (
                  <Badge variant="outline" className="capitalize">
                    {task.period}
                  </Badge>
                ) : null}
                <span>
                  {task.period === "daily"
                    ? formatDateLabel(task.task_date)
                    : periodLabel(task.period, task.task_date, task.due_date)}
                </span>
                <span>
                  · Due {formatDateLabel(taskDeadline(task.period, task.task_date, task.due_date))}
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
