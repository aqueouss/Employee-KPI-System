import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  ATTENDANCE_STATUS_DOT,
  ATTENDANCE_STATUS_LABELS,
} from "@/components/attendance/attendance-constants";
import {
  AttendanceStatusBadge,
  shortLeaveLabel,
} from "@/components/attendance/attendance-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateLabel, startOfMonthDateString } from "@/lib/utils/dates";
import { AttendanceDatePicker } from "@/components/admin/attendance-date-picker";
import type { TodayAttendanceEmployee } from "@/lib/attendance/today-overview";
import type { AttendanceStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const SUMMARY_STATUSES: (AttendanceStatus | "unmarked")[] = [
  "present",
  "late",
  "half_day",
  "short_leave",
  "paid_leave",
  "absent",
  "unmarked",
];

function summaryLabel(status: AttendanceStatus | "unmarked") {
  if (status === "unmarked") return "Not marked";
  return ATTENDANCE_STATUS_LABELS[status];
}

function summaryDotClass(status: AttendanceStatus | "unmarked") {
  if (status === "unmarked") return "bg-muted-foreground/40";
  return ATTENDANCE_STATUS_DOT[status];
}

function cardBorderClass(status: AttendanceStatus | null) {
  if (!status) {
    return "border-dashed border-border/80 bg-muted/20";
  }

  switch (status) {
    case "present":
      return "border-emerald-500/40 bg-emerald-500/5";
    case "late":
      return "border-amber-500/40 bg-amber-500/5";
    case "half_day":
      return "border-violet-500/40 bg-violet-500/5";
    case "short_leave":
      return "border-cyan-500/40 bg-cyan-500/5";
    case "paid_leave":
      return "border-blue-500/40 bg-blue-500/5";
    case "absent":
      return "border-red-500/40 bg-red-500/5";
    case "sunday_leave":
      return "border-orange-500/40 bg-orange-500/5";
    default:
      return "border-border/80";
  }
}

function EmployeeAttendanceCard({
  employee,
  date,
}: {
  employee: TodayAttendanceEmployee;
  date: string;
}) {
  const shortLabel = shortLeaveLabel(employee.short_leave_type);
  const month = startOfMonthDateString(date);

  return (
    <Link
      href={`/admin/attendance/${employee.id}?month=${month}`}
      className={cn(
        "group flex min-h-[5.5rem] flex-col justify-between rounded-xl border p-3 transition-colors hover:bg-accent/40",
        cardBorderClass(employee.status),
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium group-hover:text-primary">
          {employee.full_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {employee.department || "No department"}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {employee.status ? (
          <AttendanceStatusBadge status={employee.status} />
        ) : (
          <Badge variant="outline">Not marked</Badge>
        )}
        {shortLabel ? (
          <Badge variant="outline" className="text-[10px]">
            {shortLabel}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}

export function TodayAttendanceGrid({
  date,
  employees,
  counts,
  isToday = false,
}: {
  date: string;
  employees: TodayAttendanceEmployee[];
  counts: Record<AttendanceStatus | "unmarked", number>;
  isToday?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>
            {isToday ? "Today's attendance" : "Attendance overview"}
          </CardTitle>
          <CardDescription>{formatDateLabel(date)}</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <AttendanceDatePicker date={date} />
          {isToday ? (
            <Link
              href="/admin/attendance/today"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Mark attendance
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {SUMMARY_STATUSES.map((status) => (
            <div
              key={status}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", summaryDotClass(status))}
                />
                <span className="truncate text-xs text-muted-foreground">
                  {summaryLabel(status)}
                </span>
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {counts[status]}
              </p>
            </div>
          ))}
        </div>

        {employees.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active employees to show.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {employees.map((employee) => (
              <EmployeeAttendanceCard
                key={employee.id}
                employee={employee}
                date={date}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
