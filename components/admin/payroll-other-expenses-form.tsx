"use client";

import { useActionState } from "react";

import {
  updatePayrollOtherExpensesAction,
  type AttendanceActionState,
} from "@/actions/attendance.actions";
import type { PayrollOtherExpenseItem } from "@/lib/payroll/other-expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AttendanceActionState = {};

export function PayrollOtherExpensesForm({
  month,
  items,
}: {
  month: string;
  items: PayrollOtherExpenseItem[];
}) {
  const [state, formAction, isPending] = useActionState(
    updatePayrollOtherExpensesAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="month" value={month} />
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`other_expense_title_${index}`}>Title</Label>
              <Input
                id={`other_expense_title_${index}`}
                name={`item_${index}_title`}
                type="text"
                maxLength={200}
                defaultValue={item.title}
                placeholder={`Expense ${index + 1} title`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`other_expense_amount_${index}`}>Expense</Label>
              <Input
                id={`other_expense_amount_${index}`}
                name={`item_${index}_expense`}
                type="number"
                step="1"
                min={0}
                defaultValue={item.expense}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`other_expense_remarks_${index}`}>Remarks</Label>
              <Input
                id={`other_expense_remarks_${index}`}
                name={`item_${index}_remarks`}
                type="text"
                maxLength={500}
                defaultValue={item.remarks}
                placeholder="Optional remarks"
              />
            </div>
          </div>
        ))}
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save other expenses"}
      </Button>
    </form>
  );
}
