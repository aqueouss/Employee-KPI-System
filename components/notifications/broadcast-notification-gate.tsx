"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

import {
  acknowledgeBroadcastNotificationAction,
  type BroadcastNotificationActionState,
} from "@/actions/broadcast-notification.actions";
import type { BroadcastNotification } from "@/lib/broadcast-notifications";
import { playNotificationBeep } from "@/lib/notifications/play-notification-beep";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 10000;
const initialState: BroadcastNotificationActionState = {};

function BroadcastNotificationModal({
  notification,
  remaining,
  onAcknowledged,
}: {
  notification: BroadcastNotification;
  remaining: number;
  onAcknowledged: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    acknowledgeBroadcastNotificationAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onAcknowledged();
  }, [state.success, onAcknowledged]);

  return (
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
              {remaining > 1
                ? `${remaining} announcements waiting. Read and acknowledge each one to continue.`
                : "Please read this announcement and acknowledge to continue."}
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
          <input type="hidden" name="notification_id" value={notification.id} />
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="sm:min-w-40"
          >
            {isPending
              ? "Saving..."
              : remaining > 1
                ? "Acknowledge & next"
                : "Acknowledge"}
          </Button>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export function BroadcastNotificationGate({
  notifications: initialNotifications,
  children,
}: {
  notifications: BroadcastNotification[];
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] =
    useState<BroadcastNotification[]>(initialNotifications);
  const [currentIndex, setCurrentIndex] = useState(0);
  const knownIds = useRef(new Set(initialNotifications.map((n) => n.id)));
  const bootstrapped = useRef(false);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/broadcasts", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications?: BroadcastNotification[];
      };
      const next = data.notifications ?? [];
      setNotifications(next);
      setCurrentIndex((index) => Math.min(index, Math.max(0, next.length - 1)));
      return next;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setNotifications(initialNotifications);
    knownIds.current = new Set(initialNotifications.map((n) => n.id));
  }, [initialNotifications]);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const next = await refreshNotifications();
      if (!active || !next) return;

      const hasNew = next.some((n) => !knownIds.current.has(n.id));
      if (hasNew && bootstrapped.current) {
        playNotificationBeep();
        setCurrentIndex(0);
      }

      knownIds.current = new Set(next.map((n) => n.id));
      bootstrapped.current = true;
    };

    void poll();
    const id = window.setInterval(poll, POLL_INTERVAL_MS);
    const onFocus = () => void poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    const supabase = createClient();
    const channel = supabase
      .channel("broadcast-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "broadcast_notifications",
        },
        () => {
          void poll();
        },
      )
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [refreshNotifications]);

  const notification = notifications[currentIndex] ?? null;
  const visible = notifications.length > 0 && currentIndex < notifications.length;
  const remaining = notifications.length - currentIndex;

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  const handleAcknowledged = useCallback(() => {
    void refreshNotifications().then((next) => {
      if (!next?.length) {
        setCurrentIndex(0);
        return;
      }
      setCurrentIndex(0);
    });
  }, [refreshNotifications]);

  return (
    <>
      {children}
      {visible && notification ? (
        <BroadcastNotificationModal
          key={notification.id}
          notification={notification}
          remaining={remaining}
          onAcknowledged={handleAcknowledged}
        />
      ) : null}
    </>
  );
}
