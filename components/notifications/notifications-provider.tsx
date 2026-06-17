"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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

const POLL_INTERVAL_MS = 20000;

const MESSAGES: Record<string, string> = {
  approvals: "A task is awaiting your approval",
  warnings: "A new warning was issued",
  reviews: "A termination review needs attention",
  rewards: "An employee is eligible for a reward",
  reminders: "An employee raised a reminder / blocker",
  newTasks: "An admin assigned you a new task",
};

export function NotificationsProvider({
  initialCounts,
  children,
}: {
  initialCounts: Counts;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [permission, setPermission] = useState<PermissionState>("default");
  const prevCounts = useRef<Counts>(initialCounts);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const beep = useCallback(() => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      const ctx = audioCtxRef.current ?? new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio is best-effort; ignore failures (e.g. autoplay policy).
    }
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      // The click is a user gesture, so unlock audio for later beeps.
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor) {
        const ctx = audioCtxRef.current ?? new Ctor();
        audioCtxRef.current = ctx;
        void ctx.resume();
      }
    } catch {
      // ignore
    }
  }, []);

  const fireNotifications = useCallback(
    (next: Counts) => {
      const newMessages: string[] = [];
      for (const key of Object.keys(next)) {
        const before = prevCounts.current[key] ?? 0;
        if (next[key] > before && MESSAGES[key]) {
          newMessages.push(MESSAGES[key]);
        }
      }
      if (newMessages.length === 0) return;

      beep();

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
            icon: "/favicon.ico",
          });
        } catch {
          // ignore
        }
      }
    },
    [beep],
  );

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = (await res.json()) as { counts?: Counts };
        if (!active || !data.counts) return;
        fireNotifications(data.counts);
        prevCounts.current = data.counts;
        setCounts(data.counts);
      } catch {
        // ignore transient network errors
      }
    };

    const id = window.setInterval(poll, POLL_INTERVAL_MS);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fireNotifications]);

  return (
    <NotificationsContext.Provider value={{ counts, permission, enable }}>
      {children}
    </NotificationsContext.Provider>
  );
}
