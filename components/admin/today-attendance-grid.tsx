import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  ATTENDANCE_STATUS_CARD,
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_DOT,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_SUMMARY,
} from "@/components/attendance/attendance-constants";
import { shortLeaveLabel } from "@/components/attendance/attendance-status-badge";
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
  "late_half_day",
  "short_leave",
  "late_short_leave",
  "paid_leave",
  "absent",
  "unmarked",
];

function summaryLabel(status: AttendanceStatus | "unmarked") {
  if (status === "unmarked") return "Not marked";
  return ATTENDANCE_STATUS_LABELS[status];
}

function summaryDotClass(status: AttendanceStatus | "unmarked") {
  if (status === "unmarked") return "bg-muted-foreground/60";
  return cn("h-2.5 w-2.5", ATTENDANCE_STATUS_DOT[status]);
}

function cardSurfaceClass(status: AttendanceStatus | null) {
  if (!status) {
    return "border-2 border-dashed border-muted-foreground/50 bg-muted/50";
  }
  return cn("border-2", ATTENDANCE_STATUS_CARD[status]);
}

function summarySurfaceClass(status: AttendanceStatus | "unmarked") {
  if (status === "unmarked") {
    return "border-muted-foreground/50 bg-muted/40";
  }
  return cn("border", ATTENDANCE_STATUS_SUMMARY[status]);
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
        "group flex min-h-[5.5rem] flex-col justify-between rounded-xl p-3 transition-all hover:brightness-[0.97] hover:shadow-md",
        cardSurfaceClass(employee.status),
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
          {employee.full_name}
        </p>
        <p className="truncate text-xs font-medium text-foreground/70">
          {employee.department || "No department"}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {employee.status ? (
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold",
              ATTENDANCE_STATUS_COLORS[employee.status],
            )}
          >
            {ATTENDANCE_STATUS_LABELS[employee.status]}
          </span>
        ) : (
          <Badge variant="outline" className="font-semibold">
            Not marked
          </Badge>
        )}
        {shortLabel ? (
          <Badge
            variant="outline"
            className="border-foreground/30 bg-background/80 text-[10px] font-semibold"
          >
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
              className={cn(
                "rounded-lg px-3 py-2",
                summarySurfaceClass(status),
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn("shrink-0 rounded-full", summaryDotClass(status))}
                />
                <span className="truncate text-xs font-semibold text-foreground/80">
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
