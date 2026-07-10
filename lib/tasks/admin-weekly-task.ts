import { isTaskWithinDeadline, taskDeadline } from "@/lib/utils/dates";

type AdminWeeklyTask = {
  period: string;
  created_by_admin: boolean;
  status: string;
  task_date: string;
  due_date?: string | null;
};

/** Admin weekly tasks stay visible until approved; they are not hidden after due_date. */
export function isVisibleAdminWeeklyTask(
  task: AdminWeeklyTask,
  today: string,
): boolean {
  if (task.period !== "weekly" || !task.created_by_admin) return false;
  if (task.status !== "completed") return true;
  const deadline = taskDeadline("weekly", task.task_date, task.due_date);
  return deadline >= today;
}

/** True when an admin weekly task is past its due date but still unresolved. */
export function isOverdueAdminWeeklyTask(
  task: AdminWeeklyTask,
  today: string,
): boolean {
  if (!isVisibleAdminWeeklyTask(task, today)) return false;
  if (task.status === "completed") return false;
  return !isTaskWithinDeadline("weekly", task.task_date, today, task.due_date);
}
