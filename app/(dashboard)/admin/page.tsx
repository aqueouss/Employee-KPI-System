import Link from "next/link";
import { Users, AlertTriangle, Award, Gavel, ArrowRight } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString, addDaysToDateString } from "@/lib/utils/dates";
import { FlagBadge } from "@/components/kpi/flag-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { KpiFlag } from "@/types/domain";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const yesterday = addDaysToDateString(getTodayDateString(), -1);

  const [
    { count: employeeCount },
    { count: activeWarnings },
    { count: pendingRewards },
    { count: openReviews },
    { data: latestSnapshots },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("warnings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("status", "eligible"),
    supabase
      .from("termination_reviews")
      .select("id", { count: "exact", head: true })
      .in("status", ["eligible", "under_review"]),
    supabase
      .from("daily_kpi_snapshots")
      .select("flag")
      .eq("kpi_date", yesterday),
  ]);

  const flagCounts = (latestSnapshots ?? []).reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.flag] = (acc[s.flag] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const stats = [
    {
      label: "Employees",
      value: employeeCount ?? 0,
      href: "/admin/employees",
      icon: Users,
    },
    {
      label: "Active warnings",
      value: activeWarnings ?? 0,
      href: "/admin/warnings",
      icon: AlertTriangle,
    },
    {
      label: "Pending rewards",
      value: pendingRewards ?? 0,
      href: "/admin/rewards",
      icon: Award,
    },
    {
      label: "Open reviews",
      value: openReviews ?? 0,
      href: "/admin/termination-reviews",
      icon: Gavel,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Company-wide KPI, warnings, and rewards at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{s.label}</CardDescription>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-3xl">{s.value}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center text-xs text-muted-foreground">
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yesterday&apos;s KPI flags</CardTitle>
          <CardDescription>
            Finalized snapshots for {yesterday}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(["green", "yellow", "red", "no_tasks"] as KpiFlag[]).map((f) => (
            <div key={f} className="flex items-center gap-2">
              <FlagBadge flag={f} />
              <span className="text-lg font-semibold">
                {flagCounts[f] ?? 0}
              </span>
            </div>
          ))}
          {(latestSnapshots ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No snapshots for yesterday yet. Run the daily KPI job.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
