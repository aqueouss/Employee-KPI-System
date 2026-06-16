"use client";

import { Bell, BellOff, BellRing } from "lucide-react";

import { useNotifications } from "@/components/notifications/notifications-provider";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const { permission, enable } = useNotifications();

  if (permission === "unsupported") return null;

  const granted = permission === "granted";
  const denied = permission === "denied";

  const Icon = granted ? BellRing : denied ? BellOff : Bell;
  const label = granted
    ? "Notifications on"
    : denied
      ? "Notifications blocked (enable in browser settings)"
      : "Enable notifications";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9"
      aria-label={label}
      title={label}
      onClick={enable}
      disabled={granted}
    >
      <Icon
        className={granted ? "h-4 w-4 text-emerald-600" : "h-4 w-4"}
      />
    </Button>
  );
}
