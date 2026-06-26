"use client";

import { useActionState } from "react";

import {
  updateKpiRulesAction,
  type AdminActionState,
} from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database.types";

const initialState: AdminActionState = {};

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function KpiRulesForm({ rules }: { rules: Tables<"kpi_rules"> }) {
  const [state, formAction, isPending] = useActionState(
    updateKpiRulesAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="green_threshold"
          label="Green threshold (%)"
          hint="Completion at or above this is a green flag."
        >
          <Input
            id="green_threshold"
            name="green_threshold"
            type="number"
            step="0.01"
            min={1}
            max={100}
            defaultValue={rules.green_threshold}
            required
          />
        </Field>
        <Field
          id="yellow_threshold"
          label="Yellow threshold (%)"
          hint="At or above this (but below green) is yellow; below is red."
        >
          <Input
            id="yellow_threshold"
            name="yellow_threshold"
            type="number"
            step="0.01"
            min={1}
            max={100}
            defaultValue={rules.yellow_threshold}
            required
          />
        </Field>
        <Field
          id="red_flags_for_warning"
          label="Red flags per warning"
          hint="Red days in a month before a warning is issued."
        >
          <Input
            id="red_flags_for_warning"
            name="red_flags_for_warning"
            type="number"
            min={1}
            defaultValue={rules.red_flags_for_warning}
            required
          />
        </Field>
        <Field
          id="warnings_for_termination"
          label="Warnings for review"
          hint="Warnings in the window before a termination review."
        >
          <Input
            id="warnings_for_termination"
            name="warnings_for_termination"
            type="number"
            min={1}
            defaultValue={rules.warnings_for_termination}
            required
          />
        </Field>
        <Field
          id="termination_window_days"
          label="Review window (days)"
          hint="Rolling window for counting warnings."
        >
          <Input
            id="termination_window_days"
            name="termination_window_days"
            type="number"
            min={1}
            defaultValue={rules.termination_window_days}
            required
          />
        </Field>
        <Field
          id="green_streak_for_reward"
          label="Reward streak (days)"
          hint="Consecutive green days to become reward eligible (Sundays excluded)."
        >
          <Input
            id="green_streak_for_reward"
            name="green_streak_for_reward"
            type="number"
            min={1}
            defaultValue={rules.green_streak_for_reward}
            required
          />
        </Field>
        <Field
          id="company_timezone"
          label="Company timezone"
          hint="IANA timezone, e.g. Asia/Karachi."
        >
          <Input
            id="company_timezone"
            name="company_timezone"
            defaultValue={rules.company_timezone}
            required
          />
        </Field>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save rules"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Current version: v{rules.version}
        </span>
      </div>
    </form>
  );
}
