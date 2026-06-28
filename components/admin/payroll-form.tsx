"use client";

import { useActionState } from "react";

import {
  updatePayrollAction,
  type AttendanceActionState,
} from "@/actions/attendance.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database.types";

const initialState: AttendanceActionState = {};

export function PayrollForm({
  employeeId,
  month,
  payroll,
}: {
  employeeId: string;
  month: string;
  payroll: Tables<"monthly_payroll"> | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updatePayrollAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="incentives">Incentives</Label>
          <Input
            id="incentives"
            name="incentives"
            type="number"
            step="1"
            min={0}
            defaultValue={Number(payroll?.incentives ?? 0)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Bonus or performance incentive for this month.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="conveyance">Conveyance reimbursement</Label>
          <Input
            id="conveyance"
            name="conveyance"
            type="number"
            step="1"
            min={0}
            defaultValue={Number(payroll?.conveyance ?? 0)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Travel or transport allowance for this month.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="advance_deduction">Advance payment deduction</Label>
          <Input
            id="advance_deduction"
            name="advance_deduction"
            type="number"
            step="1"
            min={0}
            defaultValue={Number(payroll?.advance_deduction ?? 0)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Amount to recover from salary if the employee took an advance.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          name="notes"
          type="text"
          maxLength={500}
          defaultValue={payroll?.notes ?? ""}
          placeholder="e.g. advance taken on 5 Jun"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save payroll"}
      </Button>
    </form>
  );
}
