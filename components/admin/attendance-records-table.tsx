"use client";

import { useTransition } from "react";

import { deleteAttendanceAction } from "@/actions/attendance.actions";
import {
  AttendanceStatusBadge,
  shortLeaveLabel,
} from "@/components/attendance/attendance-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateLabel } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

export function AttendanceRecordsTable({
  employeeId,
  records,
  canEdit,
}: {
  employeeId: string;
  records: Tables<"attendance_records">[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(date: string) {
    if (!confirm("Remove this attendance record?")) return;
    startTransition(async () => {
      await deleteAttendanceAction(employeeId, date);
    });
  }

  if (records.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No attendance records this month.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Details</TableHead>
          {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {formatDateLabel(r.attendance_date)}
            </TableCell>
            <TableCell>
              <AttendanceStatusBadge status={r.status} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {r.short_leave_type
                ? shortLeaveLabel(r.short_leave_type)
                : r.notes || (r.is_auto_generated ? "Auto (weekly rule)" : "—")}
            </TableCell>
            {canEdit ? (
              <TableCell className="text-right">
                {!r.is_auto_generated ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(r.attendance_date)}
                  >
                    Remove
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Auto</span>
                )}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
