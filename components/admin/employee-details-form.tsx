"use client";

import { useActionState, useEffect, useState } from "react";

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
  department,
  monthlySalary,
  kpiTracked,
  isAdmin,
}: {
  employeeId: string;
  hireDate: string | null;
  jobDesignation: string | null;
  department: string | null;
  monthlySalary: number | null;
  kpiTracked: boolean;
  isAdmin?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateEmployeeDetailsAction,
    initialState,
  );
  const [employeeType, setEmployeeType] = useState(
    kpiTracked ? "true" : "false",
  );

  useEffect(() => {
    setEmployeeType(kpiTracked ? "true" : "false");
  }, [kpiTracked]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="kpi_tracked" value={employeeType} />
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
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            maxLength={80}
            defaultValue={department ?? ""}
            placeholder="e.g. Engineering"
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
        <div className="space-y-1.5">
          <Label htmlFor="monthly_salary">Monthly salary</Label>
          <Input
            id="monthly_salary"
            name="monthly_salary"
            type="number"
            min={0}
            step={1}
            defaultValue={monthlySalary ?? ""}
            placeholder="e.g. 50000"
          />
        </div>
        {!isAdmin ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="kpi_tracked">Employee type</Label>
            <select
              id="kpi_tracked"
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="true">KPI employee</option>
              <option value="false">Payroll only</option>
            </select>
          </div>
        ) : null}
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
