"use client";

import { useActionState } from "react";

import {
  updateEmployeeDetailsAction,
  type AdminActionState,
} from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = {};

export function EmployeeDetailsForm({
  employeeId,
  hireDate,
  jobDesignation,
}: {
  employeeId: string;
  hireDate: string | null;
  jobDesignation: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateEmployeeDetailsAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employee_id" value={employeeId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="job_designation">Job designation</Label>
          <Input
            id="job_designation"
            name="job_designation"
            maxLength={120}
            defaultValue={jobDesignation ?? ""}
            placeholder="e.g. Frontend Engineer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hire_date">Hire date</Label>
          <Input
            id="hire_date"
            name="hire_date"
            type="date"
            defaultValue={hireDate ?? ""}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save details"}
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
