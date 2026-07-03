"use client";

import { useTransition } from "react";
import { X } from "lucide-react";

import { cancelLeaveRequestAction } from "@/actions/leave-request.actions";
import { formatDateLabel } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<Tables<"leave_requests">["leave_type"], string> = {
  paid_leave: "Full-day leave",
  half_day: "Half day",
  short_leave: "Short leave",
};

const STATUS_VARIANT: Record<
  Tables<"leave_requests">["status"],
  "warning" | "success" | "destructive"
> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export function EmployeeLeaveRequestList({
  requests,
}: {
  requests: Tables<"leave_requests">[];
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        No leave requests yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <LeaveRequestRow key={request.id} request={request} />
      ))}
    </div>
  );
}

function LeaveRequestRow({ request }: { request: Tables<"leave_requests"> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-md border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{formatDateLabel(request.leave_date)}</p>
            <Badge variant="outline">{TYPE_LABELS[request.leave_type]}</Badge>
            <Badge variant={STATUS_VARIANT[request.status]}>
              {request.status}
            </Badge>
          </div>
          {request.leave_type === "short_leave" && request.short_leave_type ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {request.short_leave_type === "late_arrival"
                ? "Arrive 11:30 AM"
                : "Leave 4:30 PM"}
            </p>
          ) : null}
          {request.reason ? (
            <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
          ) : null}
          {request.review_note ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Admin: {request.review_note}
            </p>
          ) : null}
        </div>
        {request.status === "pending" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", request.id);
              startTransition(async () => {
                await cancelLeaveRequestAction({}, fd);
              });
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
