import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  getTodayDateString,
  isEditableDate,
  isOpenTask,
  isTaskEditableNow,
  parseDateString,
  periodStartDate,
  periodLabel,
  type TaskPeriod,
} from "@/lib/utils/dates";
import { DateNavigator } from "@/components/tasks/date-navigator";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskItem } from "@/components/tasks/task-item";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

const NON_DAILY: {
  period: Exclude<TaskPeriod, "daily" | "custom">;
  title: string;
  placeholder: string;
}[] = [
  { period: "weekly", title: "Weekly tasks", placeholder: "Add a weekly task..." },
  {
    period: "monthly",
    title: "Monthly tasks",
    placeholder: "Add a monthly task...",
  },
  {
    period: "quarterly",
    title: "Quarterly tasks",
    placeholder: "Add a quarterly task...",
  },
];

export default async function EmployeeTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireRole(["admin", "employee"]);
  const today = getTodayDateString();
  const params = await searchParams;
  const date = parseDateString(params.date) ?? today;
  const editable = isEditableDate(date, today);

  const supabase = await createClient();

  // Opening the tasks page clears the "new task" notification badge.
  await supabase
    .from("tasks")
    .update({ seen_by_employee: true })
    .eq("employee_id", profile.id)
    .eq("created_by_admin", true)
    .eq("seen_by_employee", false);

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("employee_id", profile.id)
    .eq("task_date", date)
    .eq("period", "daily")
    .order("created_at", { ascending: true });

  const tasks = (data ?? []) as Tables<"tasks">[];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const submitted = tasks.filter((t) => t.status === "submitted").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Current-period non-daily tasks.
  const periodStarts = Object.fromEntries(
    NON_DAILY.map((n) => [n.period, periodStartDate(n.period, today)]),
  ) as Record<Exclude<TaskPeriod, "daily" | "custom">, string>;

  const { data: nonDailyData } = await supabase
    .from("tasks")
    .select("*")
    .eq("employee_id", profile.id)
    .in("period", ["weekly", "monthly", "quarterly"])
    .in("task_date", Object.values(periodStarts))
    .order("created_at", { ascending: true });

  const { data: customTaskData } = await supabase
    .from("tasks")
    .select("*")
    .eq("employee_id", profile.id)
    .eq("period", "custom")
    .order("due_date", { ascending: true });

  const nonDailyTasks = (nonDailyData ?? []) as Tables<"tasks">[];
  const customTasks = ((customTaskData ?? []) as Tables<"tasks">[]).filter(
    (task) =>
      isOpenTask(task.status, task.period, task.task_date, today, task.due_date),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Plan your work across daily, weekly, monthly, and quarterly goals.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <DateNavigator date={date} today={today} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily completion</CardTitle>
              <CardDescription>
                {completed} of {total} approved
                {submitted > 0 ? ` · ${submitted} awaiting approval` : ""}
              </CardDescription>
            </div>
            <Badge
              variant={
                total === 0 ? "secondary" : pct >= 90 ? "success" : pct >= 70 ? "warning" : "destructive"
              }
            >
              {total === 0 ? "No tasks" : `${pct}%`}
            </Badge>
          </div>
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

      {editable ? (
        <TaskCreateForm taskDate={date} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This day is in the past and is read-only.
        </p>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            No daily tasks for this day.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} editable={editable} />
          ))
        )}
      </div>

      {NON_DAILY.map(({ period, title, placeholder }) => {
        const start = periodStarts[period];
        const items = nonDailyTasks.filter(
          (t) => t.period === period && t.task_date === start,
        );
        return (
          <Card key={period}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{periodLabel(period, start)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TaskCreateForm
                taskDate={start}
                period={period}
                placeholder={placeholder}
              />
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                    No {period} tasks yet.
                  </div>
                ) : (
                  items.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      editable={isTaskEditableNow(
                        task.period,
                        task.task_date,
                        today,
                        task.due_date,
                      )}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {customTasks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom duration tasks</CardTitle>
            <CardDescription>
              Assigned by admin with a specific deadline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {customTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                editable={isTaskEditableNow(
                  task.period,
                  task.task_date,
                  today,
                  task.due_date,
                )}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
