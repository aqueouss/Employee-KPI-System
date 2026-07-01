"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Award,
  SlidersHorizontal,
  ClipboardList,
  ClipboardCheck,
  CalendarCheck,
  Building2,
  Gauge,
  MessageSquareWarning,
  ScrollText,
  Trophy,
  UserCircle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { useNotifications } from "@/components/notifications/notifications-provider";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
  badgeKey?: string;
  isActive?: (pathname: string) => boolean;
};

type NavGroup = {
  label: string;
  icon: LucideIcon;
  children: NavItem[];
};

type NavEntry =
  | ({ type: "link" } & NavItem)
  | ({ type: "group" } & NavGroup);

const adminNav: NavEntry[] = [
  {
    type: "link",
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { type: "link", href: "/admin/employees", label: "Employees", icon: Users },
  {
    type: "link",
    href: "/admin/departments",
    label: "Departments",
    icon: Building2,
  },
  {
    type: "link",
    href: "/admin/approvals",
    label: "Approvals",
    icon: ClipboardCheck,
    badgeKey: "approvals",
  },
  {
    type: "group",
    label: "KPI",
    icon: Gauge,
    children: [
      {
        href: "/admin/warnings",
        label: "Warnings",
        badgeKey: "warnings",
      },
      {
        href: "/admin/termination-reviews",
        label: "Reviews",
        badgeKey: "reviews",
      },
      {
        href: "/admin/rewards",
        label: "Rewards",
        badgeKey: "rewards",
      },
    ],
  },
  {
    type: "group",
    label: "Attendance",
    icon: CalendarCheck,
    children: [
      {
        href: "/admin/attendance",
        label: "Overview",
        isActive: (pathname) =>
          pathname === "/admin/attendance" ||
          (pathname.startsWith("/admin/attendance/") &&
            !pathname.startsWith("/admin/attendance/today")),
      },
      { href: "/admin/attendance/today", label: "Mark today", exact: true },
      { href: "/admin/payroll", label: "Monthly payroll" },
    ],
  },
  {
    type: "link",
    href: "/admin/reminders",
    label: "Reminders",
    icon: MessageSquareWarning,
    badgeKey: "reminders",
  },
  {
    type: "link",
    href: "/admin/kpi-rules",
    label: "KPI Rules",
    icon: SlidersHorizontal,
  },
  {
    type: "link",
    href: "/admin/activity",
    label: "Activity",
    icon: ScrollText,
  },
];

const employeeNav: NavEntry[] = [
  {
    type: "link",
    href: "/employee",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    badgeKey: "newTasks",
  },
  {
    type: "link",
    href: "/employee/tasks",
    label: "Tasks",
    icon: ClipboardList,
    badgeKey: "newTasks",
  },
  {
    type: "link",
    href: "/employee/reminders",
    label: "Reminders",
    icon: MessageSquareWarning,
  },
  { type: "link", href: "/employee/kpi", label: "KPI", icon: Gauge },
  {
    type: "link",
    href: "/employee/attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
  { type: "link", href: "/employee/rewards", label: "Rewards", icon: Award },
  {
    type: "link",
    href: "/employee/warnings",
    label: "Warnings",
    icon: AlertTriangle,
  },
];

const payrollEmployeeNav: NavEntry[] = [
  {
    type: "link",
    href: "/employee/attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
];

const sharedNav: NavEntry[] = [
  { type: "link", href: "/rankings", label: "Rankings", icon: Trophy },
  { type: "link", href: "/profile", label: "Profile", icon: UserCircle },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.isActive) return item.isActive(pathname);
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLinkItem({
  item,
  pathname,
  badge,
  nested,
}: {
  item: NavItem;
  pathname: string;
  badge: number;
  nested?: boolean;
}) {
  const isActive = isItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ease-out",
        nested ? "px-3 py-2" : "px-3 py-2.5",
        isActive
          ? "nav-glow bg-primary/10 text-primary shadow-sm shadow-primary/10"
          : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent/70 hover:text-foreground",
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isActive
              ? "text-primary"
              : "group-hover:scale-110 group-hover:text-primary",
          )}
        />
      ) : (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isActive ? "bg-primary" : "bg-muted-foreground/40",
          )}
        />
      )}
      <span className="flex-1">{item.label}</span>
      <NavBadge count={badge} />
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  counts,
}: {
  group: NavGroup;
  pathname: string;
  counts: Record<string, number>;
}) {
  const hasActiveChild = group.children.some((child) =>
    isItemActive(pathname, child),
  );
  const [open, setOpen] = useState(hasActiveChild);
  const Icon = group.icon;

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const totalBadge = group.children.reduce(
    (sum, child) =>
      sum + (child.badgeKey ? (counts[child.badgeKey] ?? 0) : 0),
    0,
  );

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ease-out",
          hasActiveChild
            ? "bg-primary/5 text-primary"
            : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
        )}
        aria-expanded={open}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            hasActiveChild
              ? "text-primary"
              : "group-hover:scale-110 group-hover:text-primary",
          )}
        />
        <span className="flex-1">{group.label}</span>
        <NavBadge count={totalBadge} />
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-border/60 pl-2">
          {group.children.map((child) => (
            <NavLinkItem
              key={child.href}
              item={child}
              pathname={pathname}
              badge={child.badgeKey ? (counts[child.badgeKey] ?? 0) : 0}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardNav({
  role,
  kpiTracked = true,
}: {
  role: UserRole;
  kpiTracked?: boolean;
}) {
  const pathname = usePathname();
  const { counts } = useNotifications();
  const employeeItems = kpiTracked ? employeeNav : payrollEmployeeNav;
  const sharedItems = kpiTracked
    ? sharedNav
    : sharedNav.filter(
        (item) => item.type !== "link" || item.href !== "/rankings",
      );
  const items = [...(role === "admin" ? adminNav : employeeItems), ...sharedItems];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((entry) => {
        if (entry.type === "group") {
          return (
            <NavGroupSection
              key={entry.label}
              group={entry}
              pathname={pathname}
              counts={counts}
            />
          );
        }

        return (
          <NavLinkItem
            key={entry.href}
            item={entry}
            pathname={pathname}
            badge={entry.badgeKey ? (counts[entry.badgeKey] ?? 0) : 0}
          />
        );
      })}
    </nav>
  );
}
