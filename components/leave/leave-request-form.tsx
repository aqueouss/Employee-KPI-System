"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import {
  createLeaveRequestAction,
  type LeaveRequestActionState,
} from "@/actions/leave-request.actions";
import {
  canApplyLeaveTypeToday,
  LEAVE_CUTOFF_LABELS,
  leaveTypeLabel,
} from "@/lib/leave/leave-request-eligibility";
import { addDaysToDateString } from "@/lib/utils/dates";
import type { LeaveRequestType } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LeaveRequestActionState = {};

const LEAVE_TYPES: { value: LeaveRequestType; label: string }[] = [
  { value: "paid_leave", label: "Full-day leave" },
  { value: "half_day", label: "Half day" },
  { value: "short_leave", label: "Short leave" },
];

export function LeaveRequestForm({
  today,
  timezone,
}: {
  today: string;
  timezone: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createLeaveRequestAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [leaveType, setLeaveType] = useState<LeaveRequestType>("paid_leave");
  const [leaveDate, setLeaveDate] = useState("");

  const todayOptions = useMemo(
    () =>
      LEAVE_TYPES.map((type) => ({
        ...type,
        allowedToday: canApplyLeaveTypeToday(type.value, timezone),
      })),
    [timezone],
  );

  const minDate = useMemo(() => {
    if (todayOptions.some((type) => type.allowedToday)) return today;
    return addDaysToDateString(today, 1);
  }, [today, todayOptions]);

  const selectedDate = leaveDate || minDate;
  const isTodaySelected = selectedDate === today;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  useEffect(() => {
    const allowed = LEAVE_TYPES.find(
      (type) =>
        !isTodaySelected || canApplyLeaveTypeToday(type.value, timezone),
    );
    if (allowed) setLeaveType(allowed.value);
  }, [isTodaySelected, timezone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="leave_date">Date</Label>
          <Input
            id="leave_date"
            name="leave_date"
            type="date"
            min={minDate}
            defaultValue={minDate}
            required
            onChange={(e) => setLeaveDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Present and future dates only. Today: full-day before{" "}
            {LEAVE_CUTOFF_LABELS.paid_leave}, half-day before{" "}
            {LEAVE_CUTOFF_LABELS.half_day}, short leave before{" "}
            {LEAVE_CUTOFF_LABELS.short_leave}.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="leave_type">Leave type</Label>
          <select
            id="leave_type"
            name="leave_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveRequestType)}
            required
          >
            {LEAVE_TYPES.map((type) => (
              <option
                key={type.value}
                value={type.value}
                disabled={
                  isTodaySelected &&
                  !canApplyLeaveTypeToday(type.value, timezone)
                }
              >
                {type.label}
                {isTodaySelected &&
                !canApplyLeaveTypeToday(type.value, timezone)
                  ? " (today closed)"
                  : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {leaveType === "short_leave" ? (
        <div className="space-y-1.5">
          <Label htmlFor="short_leave_type">Short leave type</Label>
          <select
            id="short_leave_type"
            name="short_leave_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue="late_arrival"
            required
          >
            <option value="late_arrival">Arrive 11:30 AM</option>
            <option value="early_departure">Leave 4:30 PM</option>
          </select>
        </div>
      ) : (
        <input type="hidden" name="short_leave_type" value="" />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason (optional)</Label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          maxLength={500}
          placeholder={`Why do you need ${leaveTypeLabel(leaveType)}?`}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Plus className="mr-1 h-4 w-4" />
          {isPending ? "Submitting..." : "Apply for leave"}
        </Button>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}
      </div>
    </form>
  );
}
