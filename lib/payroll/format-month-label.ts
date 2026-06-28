import { monthDateRange } from "@/services/attendance/attendance.engine";

function parseParts(date: string) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

function formatShortDate(date: string): string {
  const { y, m, d } = parseParts(date);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthLabel(monthStart: string): string {
  const { y, m } = parseParts(monthStart);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function formatPayPeriod(monthStart: string): string {
  const { from, to } = monthDateRange(monthStart);
  return `${formatShortDate(from)} - ${formatShortDate(to)}`;
}

export function formatPaymentDate(monthStart: string): string {
  const { y, m } = parseParts(monthStart);
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const payment = new Date(nextMonth.y, nextMonth.m - 1, 7);
  return payment.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatInrOrDash(amount: number | null): string {
  return amount !== null ? formatInr(amount) : "—";
}
