import type { SupabaseClient } from "@supabase/supabase-js";

import { addDaysToDateString, taskDeadline } from "@/lib/utils/dates";
import type { Database } from "@/types/database.types";
import { monthKeyForDate } from "@/services/warnings/warning.engine";
import { weeklyIncompleteRedFlagDates } from "./weekly.engine";

type Client = SupabaseClient<Database>;

function daysInMonth(date: string): number {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export async function loadMonthlyWeeklyRedFlagDates(
  client: Client,
  employeeId: string,
  date: string,
  asOfDate: string,
): Promise<string[]> {
  const monthStart = monthKeyForDate(date);
  const monthEnd = addDaysToDateString(
    `${date.slice(0, 7)}-01`,
    daysInMonth(date),
  );

  const { data: tasks, error } = await client
    .from("tasks")
    .select("status, task_date, due_date")
    .eq("employee_id", employeeId)
    .eq("period", "weekly")
    .eq("created_by_admin", true);

  if (error) {
    throw new Error(`Failed to load weekly tasks: ${error.message}`);
  }

  const tasksInMonth = (tasks ?? []).filter((task) => {
    const start = task.task_date.slice(0, 10);
    return start >= monthStart && start < monthEnd;
  });

  return weeklyIncompleteRedFlagDates(tasksInMonth, asOfDate);
}

export async function loadEmployeeWeeklyIncompleteRedFlagDates(
  client: Client,
  employeeId: string,
  asOfDate: string,
): Promise<string[]> {
  const { data: tasks, error } = await client
    .from("tasks")
    .select("status, task_date, due_date")
    .eq("employee_id", employeeId)
    .eq("period", "weekly")
    .eq("created_by_admin", true);

  if (error) {
    throw new Error(`Failed to load weekly tasks: ${error.message}`);
  }

  return weeklyIncompleteRedFlagDates(tasks ?? [], asOfDate);
}
