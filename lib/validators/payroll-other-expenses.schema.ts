import { z } from "zod";

import { parseDateString } from "@/lib/utils/dates";

const otherExpenseItemSchema = z.object({
  title: z.string().max(200),
  expense: z.coerce.number().min(0).max(9999999),
  remarks: z.string().max(500),
});

export const payrollOtherExpensesSchema = z.object({
  month: z.string().refine((v) => parseDateString(v) !== null, "Invalid month."),
  items: z.array(otherExpenseItemSchema).max(50),
});

export type PayrollOtherExpensesInput = z.infer<typeof payrollOtherExpensesSchema>;

export function parsePayrollOtherExpensesItems(
  raw: unknown,
): PayrollOtherExpensesInput["items"] | null {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
