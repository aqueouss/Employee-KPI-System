"use client";

import { useActionState, useEffect, useRef, useState } from "react";

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
  const [period, setPeriod] = useState("daily");
  const [state, formAction, isPending] = useActionState(
    adminCreateTaskAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setPeriod("daily");
    }
  }, [state.success]);

  const isCustom = period === "custom";
  const usesStartDate = period === "daily" || period === "custom";

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="employee_id" value={employeeId} />
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="admin-task-title">Task title</Label>
          <Input
            id="admin-task-title"
            name="title"
            placeholder="e.g. Complete onboarding checklist"
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-task-period">Period</Label>
          <select
            id="admin-task-period"
            name="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="custom">Custom duration</option>
          </select>
        </div>
        {usesStartDate ? (
          <div className="space-y-1.5">
            <Label htmlFor="admin-task-date">
              {isCustom ? "Start date" : "Date (daily only)"}
            </Label>
            <Input
              id="admin-task-date"
              name="task_date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
        ) : (
          <input type="hidden" name="task_date" value={today} />
        )}
        {isCustom ? (
          <div className="space-y-1.5">
            <Label htmlFor="admin-task-due">Due date</Label>
            <Input
              id="admin-task-due"
              name="due_date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
        ) : (
          <input type="hidden" name="due_date" value="" />
        )}
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
