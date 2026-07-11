"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { reviewTaskAction } from "@/actions/task.actions";
import { AdminTaskDeleteButton } from "@/components/admin/admin-task-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/types/database.types";

function RejectButton({
  onClick,
  disabled,
  label = "Reject",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="btn-destructive-hover border dark:bg-destructive/15 dark:border-destructive/50"
      onClick={onClick}
      disabled={disabled}
    >
      <X className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}

function ReviewForm({
  taskId,
  mode,
  showDelete = false,
  onReviewed,
}: {
  taskId: string;
  mode: "pending" | "submitted" | "completed";
  showDelete?: boolean;
  onReviewed?: (taskId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function review(decision: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const res = await reviewTaskAction(taskId, decision, note.trim());
      if (res.error) {
        setError(res.error);
        return;
      }
      onReviewed?.(taskId);
    });
  }

  const placeholder =
    mode === "pending"
      ? "Optional note"
      : mode === "completed"
        ? "Reason for revoking approval"
        : "Optional note (shown on reject)";

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          className="h-9 min-w-0 flex-1"
          disabled={isPending}
        />
        <div className="flex flex-wrap items-center gap-2">
          {mode === "pending" ? (
            <Button
              type="button"
              size="sm"
              onClick={() => review("approve")}
              disabled={isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Approve directly
            </Button>
          ) : null}
          {mode === "submitted" ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => review("approve")}
                disabled={isPending}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <RejectButton
                onClick={() => review("reject")}
                disabled={isPending}
              />
            </>
          ) : null}
          {mode === "completed" ? (
            <RejectButton
              onClick={() => review("reject")}
              disabled={isPending}
              label="Revoke approval"
            />
          ) : null}
          {showDelete ? <AdminTaskDeleteButton taskId={taskId} compact /> : null}
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function AdminTaskActions({
  task,
  onReviewed,
}: {
  task: Tables<"tasks">;
  onReviewed?: (taskId: string) => void;
}) {
  if (task.status === "rejected") {
    return <AdminTaskDeleteButton taskId={task.id} compact />;
  }

  const mode =
    task.status === "pending"
      ? "pending"
      : task.status === "submitted"
        ? "submitted"
        : "completed";

  return (
    <ReviewForm
      taskId={task.id}
      mode={mode}
      showDelete
      onReviewed={onReviewed}
    />
  );
}

export function TaskReviewControls({ taskId }: { taskId: string }) {
  return <ReviewForm taskId={taskId} mode="submitted" />;
}

export function TaskDirectApproveControls({ taskId }: { taskId: string }) {
  return <ReviewForm taskId={taskId} mode="pending" />;
}

export function TaskRevokeControls({ taskId }: { taskId: string }) {
  return <ReviewForm taskId={taskId} mode="completed" />;
}
