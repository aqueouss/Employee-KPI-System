/**
 * Date helpers for business-day handling. Tasks are keyed by a `date` string
 * (YYYY-MM-DD) representing the company's business day.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date as YYYY-MM-DD in the given IANA timezone (default UTC). */
export function getTodayDateString(timezone = "UTC"): string {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    // Invalid timezone stored in config — fall back to UTC rather than crash.
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  // en-CA yields YYYY-MM-DD
  return formatter.format(new Date());
}

/** True if the string is a valid IANA timezone supported by the runtime. */
export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Validates a YYYY-MM-DD string. Returns the value or null. */
export function parseDateString(value: string | undefined | null): string | null {
  if (!value || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

/** Normalizes DB / API date values to YYYY-MM-DD. */
export function normalizeDateString(value: string): string {
  return value.slice(0, 10);
}

/** Adds (or subtracts) days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDaysToDateString(value: string, days: number): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** True when the date falls on Sunday (UTC). Office is closed; KPI streaks skip Sundays. */
export function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

/** Monday of the week containing the given YYYY-MM-DD date. */
export function startOfWeekDateString(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  return addDaysToDateString(value, -diff);
}

/** First day of the month containing the given YYYY-MM-DD date. */
export function startOfMonthDateString(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

/** First day of the quarter containing the given YYYY-MM-DD date. */
export function startOfQuarterDateString(value: string): string {
  const year = value.slice(0, 4);
  const month = Number(value.slice(5, 7));
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterStartMonth).padStart(2, "0")}-01`;
}

export type TaskPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "custom";

/** Last day of the month containing the given YYYY-MM-DD date. */
export function endOfMonthDateString(value: string): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${value.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

/** Last day of the quarter containing the given YYYY-MM-DD date. */
export function endOfQuarterDateString(value: string): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const endMonth = Math.floor((month - 1) / 3) * 3 + 3;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  return `${year}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** Deadline for a task (inclusive). Custom tasks use due_date; others derive from period. */
export function taskDeadline(
  period: TaskPeriod,
  taskDate: string,
  dueDate?: string | null,
): string {
  if (period === "custom" && dueDate) return dueDate;
  if (period === "daily") return taskDate;
  if (period === "weekly") return addDaysToDateString(taskDate, 6);
  if (period === "monthly") return endOfMonthDateString(taskDate);
  if (period === "quarterly") return endOfQuarterDateString(taskDate);
  return taskDate;
}

/** True when today is on or before the task deadline. */
export function isTaskWithinDeadline(
  period: TaskPeriod,
  taskDate: string,
  today: string,
  dueDate?: string | null,
): boolean {
  return today <= taskDeadline(period, taskDate, dueDate);
}

/** True for tasks still awaiting completion or approval before the deadline. */
export function isOpenTask(
  status: "pending" | "submitted" | "completed" | "rejected",
  period: TaskPeriod,
  taskDate: string,
  today: string,
  dueDate?: string | null,
): boolean {
  if (status !== "pending" && status !== "submitted") return false;
  return isTaskWithinDeadline(period, taskDate, today, dueDate);
}

/** The period-start date (used as task_date) for a given period and reference day. */
export function periodStartDate(period: TaskPeriod, value: string): string {
  switch (period) {
    case "weekly":
      return startOfWeekDateString(value);
    case "monthly":
      return startOfMonthDateString(value);
    case "quarterly":
      return startOfQuarterDateString(value);
    case "custom":
      return value;
    default:
      return value;
  }
}

/** Human label for a period's window or deadline. */
export function periodLabel(
  period: TaskPeriod,
  startValue: string,
  dueDate?: string | null,
): string {
  switch (period) {
    case "weekly":
      return `Week of ${formatDateLabel(startValue)} · due ${formatDateLabel(addDaysToDateString(startValue, 6))}`;
    case "monthly":
      return `${new Date(`${startValue}T00:00:00Z`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })} · due ${formatDateLabel(endOfMonthDateString(startValue))}`;
    case "quarterly": {
      const m = Number(startValue.slice(5, 7));
      const q = Math.floor((m - 1) / 3) + 1;
      return `Q${q} ${startValue.slice(0, 4)} · due ${formatDateLabel(endOfQuarterDateString(startValue))}`;
    }
    case "custom":
      return dueDate
        ? `Start ${formatDateLabel(startValue)} · End ${formatDateLabel(dueDate)}`
        : `Start ${formatDateLabel(startValue)}`;
    default:
      return formatDateLabel(startValue);
  }
}

/** Human-friendly label, e.g. "Mon, Jun 12, 2026". */
export function formatDateLabel(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Full weekday name, e.g. "Monday". */
export function formatWeekdayLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  });
}

/** Calendar date without weekday, e.g. "June 29, 2026". */
export function formatCalendarDateLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Tasks are editable only for today or future dates. Past business days are
 * read-only to preserve KPI accountability.
 */
export function isEditableDate(value: string, todayValue: string): boolean {
  return value >= todayValue;
}

/**
 * Whether an employee may still modify a task before its deadline.
 */
export function isTaskEditableNow(
  period: TaskPeriod,
  taskDate: string,
  today: string,
  dueDate?: string | null,
): boolean {
  if (period === "daily") return isEditableDate(taskDate, today);
  if (period === "custom") {
    if (!dueDate) return false;
    return today <= dueDate;
  }
  return taskDate === periodStartDate(period, today);
}
