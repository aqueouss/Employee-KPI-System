import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth.actions";
import { AppLogo } from "@/components/layout/app-logo";
import { requireRole } from "@/lib/auth/require-role";
import { loadPendingBroadcastNotification } from "@/lib/broadcast-notifications";
import { getNotificationCounts } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BroadcastNotificationGate } from "@/components/notifications/broadcast-notification-gate";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin", "employee"]);
  const initialCounts = await getNotificationCounts(profile);
  const supabase = await createClient();
  const pendingBroadcastNotification =
    profile.role === "employee"
      ? await loadPendingBroadcastNotification(supabase, profile.id)
      : null;

  const shell = (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 shadow-sm backdrop-blur-xl dark:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileNav role={profile.role} kpiTracked={profile.kpi_tracked} />
            <AppLogo />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden items-center gap-2 text-sm md:flex">
              <span className="text-muted-foreground">
                {profile.full_name}
                {profile.department ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {profile.department}
                  </span>
                ) : null}
              </span>
              <Badge
                variant={profile.role === "admin" ? "default" : "secondary"}
                className="capitalize shadow-sm"
              >
                {profile.role}
              </Badge>
            </div>
            <ThemeToggle />
            <NotificationBell />
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 sm:h-9 sm:w-auto sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-4 sm:py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20">
            <div className="glass-panel rounded-xl p-2">
              <DashboardNav role={profile.role} kpiTracked={profile.kpi_tracked} />
            </div>
          </div>
        </aside>
        <main className="page-enter min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );

  return (
    <NotificationsProvider initialCounts={initialCounts}>
      {profile.role === "employee" ? (
        <BroadcastNotificationGate notification={pendingBroadcastNotification}>
          {shell}
        </BroadcastNotificationGate>
      ) : (
        shell
      )}
    </NotificationsProvider>
  );
}
