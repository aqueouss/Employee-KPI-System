"use client";

import { useActionState } from "react";

import {
  updateLeaveBalanceAction,
  type AttendanceActionState,
} from "@/actions/attendance.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database.types";

const initialState: AttendanceActionState = {};

export function LeaveBalanceForm({
  employeeId,
  month,
  balance,
}: {
  employeeId: string;
  month: string;
  balance: Tables<"leave_balances"> | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateLeaveBalanceAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="paid_leave_allowance">Paid leave / month</Label>
          <Input
            id="paid_leave_allowance"
            name="paid_leave_allowance"
            type="number"
            step="0.5"
            min={0}
            defaultValue={balance?.paid_leave_allowance ?? 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="half_day_allowance">Half days / month</Label>
          <Input
            id="half_day_allowance"
            name="half_day_allowance"
            type="number"
            step="0.5"
            min={0}
            defaultValue={balance?.half_day_allowance ?? 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="short_leave_allowance">Short leaves / month</Label>
          <Input
            id="short_leave_allowance"
            name="short_leave_allowance"
            type="number"
            step="1"
            min={0}
            defaultValue={balance?.short_leave_allowance ?? 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="late_allowance">Lates allowed / month</Label>
          <Input
            id="late_allowance"
            name="late_allowance"
            type="number"
            min={0}
            defaultValue={balance?.late_allowance ?? 4}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Set initial monthly allowances. Remaining balance is calculated from
        marked attendance. Extra lates beyond allowance count as half days.
        More than 2 leaves Mon–Sat in a week auto-adds Sunday leave.
      </p>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save leave balance"}
      </Button>
    </form>
  );
}
