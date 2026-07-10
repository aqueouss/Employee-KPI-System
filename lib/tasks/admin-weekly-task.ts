import { isTaskWithinDeadline, taskDeadline } from "@/lib/utils/dates";

type AdminWeeklyTask = {
  period: string;
  created_by_admin: boolean;
  status: string;
  task_date: string;
  due_date?: string | null;
};

/** Admin views keep unresolved weekly tasks visible after the due date. */
export function isVisibleAdminWeeklyTaskForAdmin(
  task: AdminWeeklyTask,
  today: string,
): boolean {
  if (task.period !== "weekly" || !task.created_by_admin) return false;
  if (task.status !== "completed") return true;
  const deadline = taskDeadline("weekly", task.task_date, task.due_date);
  return deadline >= today;
}

/** Employee dashboard hides admin weekly tasks once the due date passes. */
export function isVisibleAdminWeeklyTaskForEmployee(
  task: AdminWeeklyTask,
  today: string,
): boolean {
  if (task.period !== "weekly" || !task.created_by_admin) return false;
  if (task.status === "completed") return false;
  return isTaskWithinDeadline("weekly", task.task_date, today, task.due_date);
}

/** Employee tasks page keeps overdue admin weekly tasks visible until approved. */
export function isVisibleAdminWeeklyTaskOnEmployeeTasksPage(
  task: AdminWeeklyTask,
): boolean {
  if (task.period !== "weekly" || !task.created_by_admin) return false;
  return task.status !== "completed";
}

/** True when an admin weekly task is past its due date but still unresolved. */
export function isOverdueAdminWeeklyTask(
  task: AdminWeeklyTask,
  today: string,
): boolean {
  if (task.period !== "weekly" || !task.created_by_admin) return false;
  if (task.status === "completed") return false;
  return !isTaskWithinDeadline("weekly", task.task_date, today, task.due_date);
}
