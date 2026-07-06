"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { markBulkAttendanceAction } from "@/actions/attendance.actions";
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
  EDITABLE_STATUSES,
} from "@/components/attendance/attendance-constants";
import { requiresShortLeaveType } from "@/services/attendance/attendance.engine";
import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, ShortLeaveType } from "@/types/domain";

export type BulkAttendanceEmployee = {
  id: string;
  full_name: string;
  department: string | null;
  status: AttendanceStatus | null;
  short_leave_type: ShortLeaveType | null;
  is_auto_generated: boolean;
};

type RowDraft = {
  status: AttendanceStatus;
  short_leave_type: ShortLeaveType | "";
};

function initialDraft(employee: BulkAttendanceEmployee): RowDraft {
  return {
    status: employee.status ?? "present",
    short_leave_type: employee.short_leave_type ?? "",
  };
}

export function BulkAttendanceTable({
  attendanceDate,
  employees,
}: {
  attendanceDate: string;
  employees: BulkAttendanceEmployee[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() =>
    Object.fromEntries(employees.map((emp) => [emp.id, initialDraft(emp)])),
  );

  const employeeSnapshot = employees
    .map(
      (emp) =>
        `${emp.id}:${emp.status ?? ""}:${emp.short_leave_type ?? ""}:${emp.is_auto_generated}`,
    )
    .join("|");

  useEffect(() => {
    setDrafts(
      Object.fromEntries(employees.map((emp) => [emp.id, initialDraft(emp)])),
    );
  }, [employeeSnapshot, employees]);

  const markedCount = useMemo(
    () => employees.filter((emp) => emp.status !== null).length,
    [employees],
  );

  function updateDraft(employeeId: string, patch: Partial<RowDraft>) {
    setDrafts((current) => ({
      ...current,
      [employeeId]: { ...current[employeeId], ...patch },
    }));
    setSuccess(null);
    setError(null);
  }

  function setAllPresent() {
    setDrafts((current) => {
      const next = { ...current };
      for (const emp of employees) {
        next[emp.id] = { status: "present", short_leave_type: "" };
      }
      return next;
    });
    setSuccess(null);
    setError(null);
  }

  function saveAll() {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const entries = employees.map((emp) => {
        const draft = drafts[emp.id];
        return {
          employee_id: emp.id,
          status: draft.status,
          short_leave_type: requiresShortLeaveType(draft.status)
            ? draft.short_leave_type || null
            : null,
        };
      });

      const invalid = entries.find(
        (entry) =>
          requiresShortLeaveType(entry.status) && !entry.short_leave_type,
      );
      if (invalid) {
        setError("Select short leave type for every short leave entry.");
        return;
      }

      const result = await markBulkAttendanceAction(attendanceDate, entries);
      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Attendance saved.");
      router.refresh();
    });
  }

  if (employees.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No active employees to mark for this date.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {markedCount} of {employees.length} already marked for today.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={setAllPresent}
            disabled={isPending}
          >
            Set all present
          </Button>
          <Button type="button" size="sm" onClick={saveAll} disabled={isPending}>
            {isPending ? "Saving…" : "Save all"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="min-w-[180px]">Short leave</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => {
            const draft = drafts[emp.id];
            return (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="font-medium">{emp.full_name}</div>
                  {emp.department ? (
                    <div className="text-xs text-muted-foreground">
                      {emp.department}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  {emp.status ? (
                    <div className="space-y-1">
                      <AttendanceStatusBadge status={emp.status} />
                      {emp.is_auto_generated ? (
                        <p className="text-xs text-muted-foreground">Auto</p>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unmarked</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {EDITABLE_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          updateDraft(emp.id, {
                            status,
                            short_leave_type:
                              requiresShortLeaveType(status)
                                ? draft.short_leave_type
                                : "",
                          })
                        }
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                          draft.status === status
                            ? `${ATTENDANCE_STATUS_COLORS[status]} shadow-sm`
                            : "bg-background hover:bg-accent/70",
                        )}
                      >
                        {ATTENDANCE_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {requiresShortLeaveType(draft.status) ? (
                    <select
                      value={draft.short_leave_type}
                      onChange={(e) =>
                        updateDraft(emp.id, {
                          short_leave_type: e.target.value as ShortLeaveType | "",
                        })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value="">Select…</option>
                      <option value="late_arrival">Arrive 11:30 AM</option>
                      <option value="early_departure">Leave 4:30 PM</option>
                    </select>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
