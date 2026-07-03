"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";

import { reviewLeaveRequestAction } from "@/actions/leave-request.actions";
import { formatDateLabel } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPE_LABELS: Record<Tables<"leave_requests">["leave_type"], string> = {
  paid_leave: "Full-day leave",
  half_day: "Half day",
  short_leave: "Short leave",
};

export function AdminLeaveRequestRow({
  request,
  employeeName,
}: {
  request: Tables<"leave_requests">;
  employeeName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const review = (decision: "approved" | "rejected") => {
    setError(null);
    const fd = new FormData();
    fd.set("id", request.id);
    fd.set("decision", decision);
    fd.set("note", note);
    startTransition(async () => {
      const res = await reviewLeaveRequestAction({}, fd);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="rounded-md border px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{formatDateLabel(request.leave_date)}</p>
            <Badge variant="outline">{TYPE_LABELS[request.leave_type]}</Badge>
            <Badge variant="warning">{request.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            <Link
              href={`/admin/employees/${request.employee_id}`}
              className="hover:underline"
            >
              {employeeName}
            </Link>{" "}
            · {new Date(request.created_at).toLocaleString()}
          </p>
          {request.leave_type === "short_leave" && request.short_leave_type ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {request.short_leave_type === "late_arrival"
                ? "Arrive 11:30 AM"
                : "Leave 4:30 PM"}
            </p>
          ) : null}
          {request.reason ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {request.reason}
            </p>
          ) : null}
        </div>

        {request.status === "pending" ? (
          <div className="flex w-full flex-col gap-2 sm:min-w-[280px]">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              maxLength={500}
              className="h-9"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => review("approved")}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => review("rejected")}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : request.review_note ? (
          <p className="text-sm text-muted-foreground">{request.review_note}</p>
        ) : null}
      </div>
    </div>
  );
}
