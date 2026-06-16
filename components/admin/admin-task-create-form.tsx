"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  adminCreateTaskAction,
  type TaskActionState,
} from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TaskActionState = {};

export function AdminTaskCreateForm({
  employeeId,
  today,
}: {
  employeeId: string;
  today: string;
}) {
  const [state, formAction, isPending] = useActionState(
    adminCreateTaskAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="employee_id" value={employeeId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="admin-task-title">Task title</Label>
          <Input
            id="admin-task-title"
            name="title"
            placeholder="e.g. Submit weekly report"
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-task-period">Period</Label>
          <select
            id="admin-task-period"
            name="period"
            defaultValue="daily"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-task-date">Date (daily only)</Label>
          <Input
            id="admin-task-date"
            name="task_date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add task"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">Task added.</p>
      ) : null}
    </form>
  );
}
