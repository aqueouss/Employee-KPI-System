import { taskDeadline } from "@/lib/utils/dates";

export type WeeklyTaskStatus =
  | "pending"
  | "submitted"
  | "completed"
  | "rejected";

export type WeeklyTaskRecord = {
  status: WeeklyTaskStatus | string;
  task_date: string;
  due_date?: string | null;
};

/** One red flag on task start date per overdue admin weekly task not sent for approval. */
export function weeklyIncompleteRedFlagDates(
  tasks: WeeklyTaskRecord[],
  asOfDate: string,
): string[] {
  const flags: string[] = [];

  for (const task of tasks) {
    if (task.status !== "pending") continue;
    const deadline = taskDeadline("weekly", task.task_date, task.due_date);
    if (asOfDate > deadline) {
      flags.push(task.task_date.slice(0, 10));
    }
  }

  return flags;
}
