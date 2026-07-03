import type { Json, Tables } from "@/types/database.types";

export type PayrollOtherExpenseItem = {
  title: string;
  expense: number;
  remarks: string;
};

function parseItem(value: unknown): PayrollOtherExpenseItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title : "";
  const expense = Number(row.expense ?? 0);
  const remarks = typeof row.remarks === "string" ? row.remarks : "";
  if (!title.trim() && expense <= 0 && !remarks.trim()) return null;
  return {
    title: title.trim(),
    expense: Number.isFinite(expense) && expense >= 0 ? expense : 0,
    remarks: remarks.trim(),
  };
}

export function payrollOtherExpensesFromRow(
  row: Tables<"monthly_payroll_other_expenses"> | null | undefined,
): PayrollOtherExpenseItem[] {
  if (!row) return [];

  const raw = row.items;
  if (!Array.isArray(raw)) return [];

  return raw
    .map(parseItem)
    .filter((item): item is PayrollOtherExpenseItem => item !== null);
}

export function payrollOtherExpensesToJson(
  items: PayrollOtherExpenseItem[],
): Json {
  return items.map((item) => ({
    title: item.title,
    expense: item.expense,
    remarks: item.remarks,
  }));
}

export function otherExpensesTotal(items: PayrollOtherExpenseItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.expense, 0) * 100) / 100;
}
