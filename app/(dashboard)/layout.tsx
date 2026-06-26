import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth.actions";
import { AppLogo } from "@/components/layout/app-logo";
import { requireRole } from "@/lib/auth/require-role";
import { getNotificationCounts } from "@/lib/notifications";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
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

  return (
    <NotificationsProvider initialCounts={initialCounts}>
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-10 border-b bg-card">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <MobileNav role={profile.role} />
              <AppLogo />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <span className="text-muted-foreground">
                  {profile.full_name}
                </span>
                <Badge
                  variant={profile.role === "admin" ? "default" : "secondary"}
                >
                  {profile.role}
                </Badge>
              </div>
              <ThemeToggle />
              <NotificationBell />
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
          <aside className="hidden w-56 shrink-0 md:block">
            <div className="sticky top-20">
              <DashboardNav role={profile.role} />
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </NotificationsProvider>
  );
}
