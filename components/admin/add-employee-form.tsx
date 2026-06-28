"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  createEmployeeAction,
  type AdminActionState,
} from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = {};

export function AddEmployeeForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createEmployeeAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => router.push("/admin/employees"), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input
          id="password"
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        <p className="text-xs text-muted-foreground">
          Share this with the employee. They can change it later.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="job_designation">Job designation</Label>
        <Input
          id="job_designation"
          name="job_designation"
          maxLength={120}
          placeholder="e.g. Frontend Engineer"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          name="department"
          maxLength={80}
          placeholder="e.g. Engineering"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hire_date">Hire date</Label>
        <Input id="hire_date" name="hire_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="employee"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">
          {state.success} Redirecting...
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || Boolean(state.success)}>
          {isPending ? "Creating..." : "Create employee"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/employees")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
