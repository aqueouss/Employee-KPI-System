"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  updatePayrollOtherExpensesAction,
  type AttendanceActionState,
} from "@/actions/attendance.actions";
import type { PayrollOtherExpenseItem } from "@/lib/payroll/other-expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AttendanceActionState = {};

const EMPTY_ITEM: PayrollOtherExpenseItem = {
  title: "",
  expense: 0,
  remarks: "",
};

export function PayrollOtherExpensesForm({
  month,
  items: initialItems,
}: {
  month: string;
  items: PayrollOtherExpenseItem[];
}) {
  const [state, formAction, isPending] = useActionState(
    updatePayrollOtherExpensesAction,
    initialState,
  );
  const [items, setItems] = useState<PayrollOtherExpenseItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        const form = event.currentTarget;
        const input = form.elements.namedItem("items_json") as HTMLInputElement;
        input.value = JSON.stringify(items);
      }}
    >
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="items_json" defaultValue="[]" />

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          No other expenses added for this month.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`other_expense_title_${index}`}>Title</Label>
                <Input
                  id={`other_expense_title_${index}`}
                  type="text"
                  maxLength={200}
                  value={item.title}
                  onChange={(event) => {
                    setItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, title: event.target.value }
                          : row,
                      ),
                    );
                  }}
                  placeholder="Expense title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`other_expense_amount_${index}`}>Expense</Label>
                <Input
                  id={`other_expense_amount_${index}`}
                  type="number"
                  step="1"
                  min={0}
                  value={item.expense}
                  onChange={(event) => {
                    setItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              expense: Number(event.target.value || 0),
                            }
                          : row,
                      ),
                    );
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`other_expense_remarks_${index}`}>Remarks</Label>
                <Input
                  id={`other_expense_remarks_${index}`}
                  type="text"
                  maxLength={500}
                  value={item.remarks}
                  onChange={(event) => {
                    setItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, remarks: event.target.value }
                          : row,
                      ),
                    );
                  }}
                  placeholder="Optional remarks"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() =>
                    setItems((current) =>
                      current.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                  aria-label={`Remove expense ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add other expense
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save other expenses"}
        </Button>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
    </form>
  );
}
