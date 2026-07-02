import { taskDeadline } from "../../lib/utils/dates.ts";

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

/** One red flag per incomplete admin weekly task after its deadline passes. */
export function weeklyIncompleteRedFlagDates(
  tasks: WeeklyTaskRecord[],
  asOfDate: string,
): string[] {
  const flags: string[] = [];

  for (const task of tasks) {
    if (task.status === "completed") continue;
    const deadline = taskDeadline("weekly", task.task_date, task.due_date);
    if (deadline <= asOfDate) {
      flags.push(deadline);
    }
  }

  return flags;
}
