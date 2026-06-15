"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Award,
  SlidersHorizontal,
  ClipboardList,
  ClipboardCheck,
  Gauge,
  Gavel,
  ScrollText,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/warnings", label: "Warnings", icon: AlertTriangle },
  {
    href: "/admin/termination-reviews",
    label: "Reviews",
    icon: Gavel,
  },
  { href: "/admin/rewards", label: "Rewards", icon: Award },
  { href: "/admin/kpi-rules", label: "KPI Rules", icon: SlidersHorizontal },
  { href: "/admin/activity", label: "Activity", icon: ScrollText },
];

const employeeNav: NavItem[] = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/employee/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/employee/kpi", label: "KPI", icon: Gauge },
  { href: "/employee/rewards", label: "Rewards", icon: Award },
  { href: "/employee/warnings", label: "Warnings", icon: AlertTriangle },
];

const sharedNav: NavItem[] = [
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = [...(role === "admin" ? adminNav : employeeNav), ...sharedNav];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
