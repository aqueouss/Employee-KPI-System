"use client";

import { useActionState } from "react";

import {
  updateOvertimeAction,
  type AttendanceActionState,
} from "@/actions/attendance.actions";
import { overtimeHoursToPaidLeave, SHIFT_HOURS } from "@/services/attendance/attendance.engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database.types";

const initialState: AttendanceActionState = {};

export function OvertimeForm({
  employeeId,
  month,
  balance,
}: {
  employeeId: string;
  month: string;
  balance: Tables<"leave_balances"> | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateOvertimeAction,
    initialState,
  );

  const hours = Number(balance?.overtime_hours ?? 0);
  const leaveCredit = overtimeHoursToPaidLeave(hours);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="overtime_hours">Overtime hours (month end)</Label>
          <Input
            id="overtime_hours"
            name="overtime_hours"
            type="number"
            step="0.5"
            min={0}
            defaultValue={hours}
            required
          />
          <p className="text-xs text-muted-foreground">
            {SHIFT_HOURS}h shift · {hours}h = {leaveCredit} paid leave day(s)
          </p>
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save overtime"}
      </Button>
    </form>
  );
}
