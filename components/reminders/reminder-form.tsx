"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import {
  createReminderAction,
  type ReminderActionState,
} from "@/actions/reminder.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ReminderActionState = {};

export function ReminderForm() {
  const [state, formAction, isPending] = useActionState(
    createReminderAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="reminder-title">Title</Label>
        <Input
          id="reminder-title"
          name="title"
          placeholder="e.g. Blocked: need access to design files"
          maxLength={200}
          required
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reminder-details">Details (optional)</Label>
        <textarea
          id="reminder-details"
          name="details"
          rows={3}
          maxLength={1000}
          placeholder="Add any context for the admin..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Plus className="mr-1 h-4 w-4" />
          {isPending ? "Sending..." : "Send to admin"}
        </Button>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">Reminder sent.</p>
        ) : null}
      </div>
    </form>
  );
}
