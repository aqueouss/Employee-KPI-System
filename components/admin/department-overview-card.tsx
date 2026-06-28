import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import { FlagBadge } from "@/components/kpi/flag-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DepartmentSummary } from "@/lib/departments/department-utils";

export function DepartmentOverviewCard({
  department,
}: {
  department: DepartmentSummary;
}) {
  return (
    <Card className="transition-colors hover:bg-accent/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-4 w-4 text-primary" />
              {department.name}
            </CardTitle>
            <CardDescription>
              {department.activeCount} active · {department.employeeCount} total
            </CardDescription>
          </div>
          <Link
            href={`/admin/departments/${department.slug}`}
            className="inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            Performance
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {department.employees.slice(0, 6).map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <Link
              href={`/admin/employees/${employee.id}`}
              className="font-medium hover:underline"
            >
              {employee.full_name}
            </Link>
            <div className="flex items-center gap-2">
              {!employee.is_active ? (
                <Badge variant="destructive">inactive</Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {employee.job_designation || "—"}
              </span>
            </div>
          </div>
        ))}
        {department.employees.length > 6 ? (
          <Link
            href={`/admin/departments/${department.slug}`}
            className="block text-xs text-muted-foreground hover:text-primary"
          >
            +{department.employees.length - 6} more in this department
          </Link>
        ) : null}
        {department.employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees assigned.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DepartmentFlagSummary({
  flagCounts,
  avgCompletionPct,
  snapshotDays,
}: {
  flagCounts: Record<string, number>;
  avgCompletionPct: number;
  snapshotDays: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["green", "yellow", "red", "no_tasks"] as const).map((flag) => (
        <div key={flag} className="flex items-center gap-2">
          <FlagBadge flag={flag} />
          <span className="text-lg font-semibold">{flagCounts[flag] ?? 0}</span>
        </div>
      ))}
      <div className="text-sm text-muted-foreground">
        Avg completion:{" "}
        <span className="font-semibold text-foreground">{avgCompletionPct}%</span>
        {snapshotDays > 0 ? ` · ${snapshotDays} snapshots` : null}
      </div>
    </div>
  );
}
