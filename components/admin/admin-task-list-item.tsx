import { Badge } from "@/components/ui/badge";
import { AdminTaskActions } from "@/components/admin/task-review-controls";
import {
  formatDateLabel,
  periodLabel,
} from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

const STATUS_META: Record<
  Tables<"tasks">["status"],
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" }
> = {
  pending: { label: "To do", variant: "secondary" },
  submitted: { label: "Pending approval", variant: "warning" },
  completed: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

function TaskDates({
  task,
}: {
  task: Pick<Tables<"tasks">, "period" | "task_date" | "due_date">;
}) {
  if (task.period === "daily") {
    return (
      <p className="text-xs text-muted-foreground">
        {formatDateLabel(task.task_date)}
      </p>
    );
  }

  if (task.period === "custom" && task.due_date) {
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>Start {formatDateLabel(task.task_date)}</p>
        <p>End {formatDateLabel(task.due_date)}</p>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      {periodLabel(task.period, task.task_date, task.due_date)}
    </p>
  );
}

export function AdminTaskListItem({ task }: { task: Tables<"tasks"> }) {
  const meta = STATUS_META[task.status];

  return (
    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          {task.period !== "daily" ? (
            <Badge variant="outline" className="shrink-0 capitalize">
              {task.period}
            </Badge>
          ) : null}
          {task.created_by_admin ? (
            <Badge variant="outline" className="text-xs">
              Admin
            </Badge>
          ) : null}
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <TaskDates task={task} />
        {task.status === "rejected" && task.review_note ? (
          <p className="text-xs text-destructive">Note: {task.review_note}</p>
        ) : null}
      </div>
      <div className="w-full shrink-0 lg:max-w-md xl:max-w-lg">
        <AdminTaskActions task={task} />
      </div>
    </div>
  );
}
