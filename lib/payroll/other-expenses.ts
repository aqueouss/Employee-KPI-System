import type { Tables } from "@/types/database.types";

export type PayrollOtherExpenseItem = {
  title: string;
  expense: number;
  remarks: string;
};

export const EMPTY_PAYROLL_OTHER_EXPENSES: PayrollOtherExpenseItem[] = [
  { title: "", expense: 0, remarks: "" },
  { title: "", expense: 0, remarks: "" },
  { title: "", expense: 0, remarks: "" },
];

export function payrollOtherExpensesFromRow(
  row: Tables<"monthly_payroll_other_expenses"> | null | undefined,
): PayrollOtherExpenseItem[] {
  if (!row) return EMPTY_PAYROLL_OTHER_EXPENSES.map((item) => ({ ...item }));

  return [
    {
      title: row.item_1_title ?? "",
      expense: Number(row.item_1_expense ?? 0),
      remarks: row.item_1_remarks ?? "",
    },
    {
      title: row.item_2_title ?? "",
      expense: Number(row.item_2_expense ?? 0),
      remarks: row.item_2_remarks ?? "",
    },
    {
      title: row.item_3_title ?? "",
      expense: Number(row.item_3_expense ?? 0),
      remarks: row.item_3_remarks ?? "",
    },
  ];
}

export function otherExpensesTotal(items: PayrollOtherExpenseItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.expense, 0) * 100) / 100;
}
