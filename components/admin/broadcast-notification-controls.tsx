"use client";

import { useActionState, useState } from "react";
import { Megaphone } from "lucide-react";

import {
  sendBroadcastNotificationAction,
  type BroadcastNotificationActionState,
} from "@/actions/broadcast-notification.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { BroadcastNotification } from "@/lib/broadcast-notifications";

const initialState: BroadcastNotificationActionState = {};

export function BroadcastNotificationControls({
  latestNotification,
  acknowledgedCount,
  employeeCount,
}: {
  latestNotification: BroadcastNotification | null;
  acknowledgedCount: number;
  employeeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    sendBroadcastNotificationAction,
    initialState,
  );

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <Button
        type="button"
        variant="outline"
        className="h-auto justify-start gap-3 rounded-xl border-border/70 bg-card/80 px-4 py-2.5 shadow-sm"
        onClick={() => setOpen((value) => !value)}
      >
        <Megaphone className="h-5 w-5 shrink-0 text-primary" />
        <div className="text-left">
          <p className="text-sm font-semibold leading-tight">Notify employees</p>
          <p className="text-xs text-muted-foreground">
            Send a full-screen message to all employees
          </p>
        </div>
      </Button>

      {open ? (
        <form
          action={formAction}
          className="w-full min-w-[280px] max-w-md rounded-xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-message">Message</Label>
            <textarea
              id="broadcast-message"
              name="message"
              rows={4}
              maxLength={2000}
              required
              placeholder="Write the announcement employees must acknowledge..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send to all employees"}
            </Button>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-emerald-600">{state.success}</p>
            ) : null}
          </div>
        </form>
      ) : null}

      {latestNotification ? (
        <p className="max-w-md text-right text-xs text-muted-foreground">
          Last sent: {new Date(latestNotification.created_at).toLocaleString()}
          {" · "}
          {acknowledgedCount}/{employeeCount} acknowledged
        </p>
      ) : null}
    </div>
  );
}
