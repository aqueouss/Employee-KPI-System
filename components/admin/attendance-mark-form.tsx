"use client";

import { useActionState } from "react";

import {
  markAttendanceAction,
  type AttendanceActionState,
} from "@/actions/attendance.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AttendanceStatus } from "@/types/domain";

const initialState: AttendanceActionState = {};

const STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "paid_leave", label: "Paid leave" },
  { value: "half_day", label: "Half day" },
  { value: "late_half_day", label: "Late + Half day" },
  { value: "short_leave", label: "Short leave" },
  { value: "late_short_leave", label: "Late + Short leave" },
  { value: "absent", label: "Absent (unpaid)" },
];

export function AttendanceMarkForm({
  employeeId,
  defaultDate,
}: {
  employeeId: string;
  defaultDate: string;
}) {
  const [state, formAction, isPending] = useActionState(
    markAttendanceAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <input type="hidden" name="employee_id" value={employeeId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="attendance_date">Date</Label>
          <Input
            id="attendance_date"
            name="attendance_date"
            type="date"
            defaultValue={defaultDate}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue="present"
            required
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="short_leave_type">Short leave type</Label>
          <select
            id="short_leave_type"
            name="short_leave_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">—</option>
            <option value="late_arrival">Arrive 11:30 AM</option>
            <option value="early_departure">Leave 4:30 PM</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Required when status is short leave or late + short leave.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Optional" />
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Mark attendance"}
      </Button>
    </form>
  );
}
