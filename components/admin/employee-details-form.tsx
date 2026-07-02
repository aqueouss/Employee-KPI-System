"use client";

import { useActionState, useEffect, useState } from "react";

import {
  updateEmployeeDetailsAction,
  type AdminActionState,
} from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLabel } from "@/lib/utils/dates";

const initialState: AdminActionState = {};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EmployeeDetailsForm({
  employeeId,
  hireDate,
  jobDesignation,
  department,
  monthlySalary,
  salaryRevisions,
  currentMonth,
  kpiTracked,
  isAdmin,
}: {
  employeeId: string;
  hireDate: string | null;
  jobDesignation: string | null;
  department: string | null;
  monthlySalary: number | null;
  salaryRevisions: Array<{
    effective_month: string;
    monthly_salary: number;
  }>;
  currentMonth: string;
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
  const [salaryValue, setSalaryValue] = useState(
    monthlySalary != null ? String(monthlySalary) : "",
  );

  useEffect(() => {
    setEmployeeType(kpiTracked ? "true" : "false");
  }, [kpiTracked]);

  useEffect(() => {
    setSalaryValue(monthlySalary != null ? String(monthlySalary) : "");
  }, [monthlySalary]);

  const salaryChanged =
    salaryValue.trim() !== "" &&
    Number(salaryValue) !== (monthlySalary ?? null);

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
          <Label htmlFor="monthly_salary">Current monthly salary</Label>
          <Input
            id="monthly_salary"
            name="monthly_salary"
            type="number"
            min={0}
            step={1}
            value={salaryValue}
            onChange={(event) => setSalaryValue(event.target.value)}
            placeholder="e.g. 50000"
          />
          <p className="text-xs text-muted-foreground">
            Used for payroll by default. Change the amount and effective month
            when giving an increment or promotion.
          </p>
        </div>
        {salaryChanged ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="salary_effective_month">Salary effective from</Label>
            <Input
              id="salary_effective_month"
              name="salary_effective_month"
              type="month"
              defaultValue={currentMonth.slice(0, 7)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              The new salary applies from this month onward. Earlier months keep
              the previous salary.
            </p>
          </div>
        ) : (
          <input
            type="hidden"
            name="salary_effective_month"
            value={currentMonth.slice(0, 7)}
          />
        )}
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

      {salaryRevisions.length > 0 ? (
        <div className="rounded-md border px-4 py-3">
          <p className="text-sm font-medium">Salary history</p>
          <div className="mt-2 space-y-1">
            {salaryRevisions.map((revision) => (
              <div
                key={revision.effective_month}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  From {formatDateLabel(revision.effective_month)}
                </span>
                <span>{formatCurrency(Number(revision.monthly_salary))}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
