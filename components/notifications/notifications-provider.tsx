"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { playNotificationBeep } from "@/lib/notifications/play-notification-beep";
import { createClient } from "@/lib/supabase/client";

type Counts = Record<string, number>;
type PermissionState = NotificationPermission | "unsupported";

type NotificationsContextValue = {
  counts: Counts;
  permission: PermissionState;
  enable: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue>({
  counts: {},
  permission: "default",
  enable: async () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

const POLL_INTERVAL_MS = 10000;

const MESSAGES: Record<string, string> = {
  approvals: "A task is awaiting your approval",
  warnings: "A new warning was issued",
  reviews: "A termination review needs attention",
  rewards: "An employee is eligible for a reward",
  reminders: "An employee raised a reminder / blocker",
  leaveRequests: "A leave request needs your approval",
  newTasks: "An admin assigned you a new task",
  broadcasts: "You have a new message from admin",
  attendanceMarked: "Your attendance was marked for today",
};

export function NotificationsProvider({
  initialCounts,
  employeeId,
  children,
}: {
  initialCounts: Counts;
  employeeId?: string;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [permission, setPermission] = useState<PermissionState>("default");
  const prevCounts = useRef<Counts>(initialCounts);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        void ctx.resume();
      }
    } catch {
      // ignore
    }
  }, []);

  const fireNotifications = useCallback(
    (next: Counts, attendanceMessage?: string | null) => {
      if (!bootstrapped.current) {
        bootstrapped.current = true;
        return;
      }

      const newMessages: string[] = [];
      for (const key of Object.keys(next)) {
        const before = prevCounts.current[key] ?? 0;
        if (next[key] > before && MESSAGES[key]) {
          if (key === "attendanceMarked" && attendanceMessage) {
            newMessages.push(attendanceMessage);
          } else {
            newMessages.push(MESSAGES[key]);
          }
        }
      }
      if (newMessages.length === 0) return;

      playNotificationBeep();

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const title =
          newMessages.length === 1
            ? "KPI System"
            : `KPI System · ${newMessages.length} updates`;
        try {
          new Notification(title, {
            body: newMessages.join("\n"),
            icon: "/icon.png",
          });
        } catch {
          // ignore
        }
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = (await res.json()) as {
          counts?: Counts;
          attendanceMessage?: string | null;
        };
        if (!active || !data.counts) return;
        fireNotifications(data.counts, data.attendanceMessage);
        prevCounts.current = data.counts;
        setCounts(data.counts);
      } catch {
        // ignore transient network errors
      }
    };

    void poll();
    const id = window.setInterval(poll, POLL_INTERVAL_MS);
    const onFocus = () => void poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fireNotifications]);

  useEffect(() => {
    if (!employeeId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`attendance-notifications-${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_mark_notifications",
          filter: `employee_id=eq.${employeeId}`,
        },
        () => {
          void fetch("/api/notifications", { cache: "no-store" })
            .then(async (res) => {
              if (!res.ok) return;
              const data = (await res.json()) as {
                counts?: Counts;
                attendanceMessage?: string | null;
              };
              if (!data.counts) return;
              fireNotifications(data.counts, data.attendanceMessage);
              prevCounts.current = data.counts;
              setCounts(data.counts);
            })
            .catch(() => {});
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [employeeId, fireNotifications]);

  return (
    <NotificationsContext.Provider value={{ counts, permission, enable }}>
      {children}
    </NotificationsContext.Provider>
  );
}
