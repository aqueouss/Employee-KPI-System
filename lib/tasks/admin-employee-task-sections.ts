import { isVisibleAdminWeeklyTaskForAdmin } from "@/lib/tasks/admin-weekly-task";
import { isOpenTask, taskDeadline } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

export type AdminEmployeeTaskSection = {
  id: "admin_weekly" | "open" | "daily";
  title: string;
  description: string;
  tasks: Tables<"tasks">[];
};

function sortByDeadline(tasks: Tables<"tasks">[]): Tables<"tasks">[] {
  return [...tasks].sort((a, b) => {
    const deadlineA = taskDeadline(a.period, a.task_date, a.due_date);
    const deadlineB = taskDeadline(b.period, b.task_date, b.due_date);
    if (deadlineA !== deadlineB) return deadlineA.localeCompare(deadlineB);
    return b.created_at.localeCompare(a.created_at);
  });
}

function sortDailyTasks(tasks: Tables<"tasks">[]): Tables<"tasks">[] {
  return [...tasks].sort((a, b) => {
    if (a.task_date !== b.task_date) {
      return b.task_date.localeCompare(a.task_date);
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

export function partitionAdminEmployeeTasks(
  tasks: Tables<"tasks">[],
  today: string,
): AdminEmployeeTaskSection[] {
  const adminWeekly = sortByDeadline(
    tasks.filter((task) => isVisibleAdminWeeklyTaskForAdmin(task, today)),
  );
  const adminWeeklyIds = new Set(adminWeekly.map((task) => task.id));

  const openTasks = sortByDeadline(
    tasks.filter(
      (task) =>
        !adminWeeklyIds.has(task.id) &&
        isOpenTask(
          task.status,
          task.period,
          task.task_date,
          today,
          task.due_date,
        ),
    ),
  );
  const openIds = new Set(openTasks.map((task) => task.id));

  const dailyTasks = sortDailyTasks(
    tasks.filter(
      (task) =>
        task.period === "daily" &&
        !adminWeeklyIds.has(task.id) &&
        !openIds.has(task.id),
    ),
  );

  return [
    {
      id: "admin_weekly",
      title: "Weekly tasks (admin assigned)",
      description:
        "Due 7 days after assignment · overdue tasks stay until approved",
      tasks: adminWeekly,
    },
    {
      id: "open",
      title: "Open tasks",
      description: "Pending or awaiting approval before the deadline",
      tasks: openTasks,
    },
    {
      id: "daily",
      title: "Daily tasks",
      description: "Completed, rejected, or past daily tasks",
      tasks: dailyTasks,
    },
  ];
}
