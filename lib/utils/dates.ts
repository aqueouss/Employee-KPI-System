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

/** Adds (or subtracts) days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDaysToDateString(value: string, days: number): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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

/**
 * Tasks are editable only for today or future dates. Past business days are
 * read-only to preserve KPI accountability.
 */
export function isEditableDate(value: string, todayValue: string): boolean {
  return value >= todayValue;
}
