"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";

import {
  acknowledgeBroadcastNotificationAction,
  type BroadcastNotificationActionState,
} from "@/actions/broadcast-notification.actions";
import type { BroadcastNotification } from "@/lib/broadcast-notifications";
import { Button } from "@/components/ui/button";

const initialState: BroadcastNotificationActionState = {};

export function BroadcastNotificationGate({
  notification,
  children,
}: {
  notification: BroadcastNotification | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(Boolean(notification));
  const [state, formAction, isPending] = useActionState(
    acknowledgeBroadcastNotificationAction,
    initialState,
  );

  useEffect(() => {
    setVisible(Boolean(notification));
  }, [notification]);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  useEffect(() => {
    if (state.success) {
      setVisible(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <>
      {children}
      {visible && notification ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl animate-fade-in-up rounded-2xl border p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Message from admin
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please read this announcement and acknowledge to continue.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border bg-card/70 p-4 sm:p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 sm:text-base">
                {notification.message}
              </p>
            </div>

            <form
              action={formAction}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input
                type="hidden"
                name="notification_id"
                value={notification.id}
              />
              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className="sm:min-w-40"
              >
                {isPending ? "Saving..." : "Acknowledge"}
              </Button>
              {state.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
