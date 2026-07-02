"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Pencil, Trash2, X } from "lucide-react";

import {
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/actions/task.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDateLabel,
  taskDeadline,
  periodLabel,
} from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

const STATUS_META: Record<
  Tables<"tasks">["status"],
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" }
> = {
  pending: { label: "To do", variant: "secondary" },
  submitted: { label: "Pending approval", variant: "warning" },
  completed: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function TaskItem({
  task,
  editable,
}: {
  task: Tables<"tasks">;
  editable: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [error, setError] = useState<string | null>(null);

  const status = task.status;
  const isSubmitted = status === "submitted";
  const isApproved = status === "completed";
  const meta = STATUS_META[status];

  const canToggle = editable && !isApproved;
  const canEdit =
    editable &&
    !task.created_by_admin &&
    (status === "pending" || status === "rejected");
  const canDelete =
    editable && status === "pending" && !task.created_by_admin;

  function handleToggle() {
    if (!canToggle) return;
    setError(null);
    startTransition(async () => {
      const res = await toggleTaskAction(task.id, !isSubmitted);
      if (res.error) setError(res.error);
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateTaskAction(task.id, title);
      if (res.error) {
        setError(res.error);
      } else {
        setIsEditing(false);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteTaskAction(task.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm transition-colors hover:border-primary/25">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={!canToggle || isPending || isEditing}
          aria-label={
            isApproved
              ? "Approved (locked)"
              : isSubmitted
                ? "Withdraw submission"
                : "Submit for approval"
          }
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all",
            isApproved &&
              "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950",
            isSubmitted &&
              "border-amber-500 bg-amber-500 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-amber-950",
            (status === "pending" || status === "rejected") &&
              "border-border bg-background hover:border-emerald-600 hover:bg-emerald-600/10",
            status === "rejected" && "border-destructive/60",
            !canToggle && "cursor-not-allowed opacity-60",
          )}
        >
          {isApproved ? <Check className="h-3.5 w-3.5" /> : null}
          {isSubmitted ? <Clock className="h-3 w-3" /> : null}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {isEditing ? (
            <div className="flex items-start gap-2">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                autoFocus
                rows={3}
                className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                onClick={handleSave}
                disabled={isPending}
                aria-label="Save"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setTitle(task.title);
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={isPending}
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "whitespace-pre-wrap text-sm font-medium leading-snug",
                    isApproved && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </span>
                {task.period !== "daily" ? (
                  <Badge variant="outline" className="capitalize">
                    {task.period}
                  </Badge>
                ) : null}
                {task.created_by_admin ? (
                  <Badge variant="outline" className="text-xs">
                    Admin
                  </Badge>
                ) : null}
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>

              {task.period !== "daily" ? (
                <p className="text-xs text-muted-foreground">
                  {periodLabel(task.period, task.task_date, task.due_date)}
                  {" · Due "}
                  {formatDateLabel(
                    taskDeadline(task.period, task.task_date, task.due_date),
                  )}
                </p>
              ) : null}

              {status === "rejected" && task.review_note ? (
                <p className="text-xs text-destructive">
                  Admin note: {task.review_note}
                </p>
              ) : null}

              {status === "rejected" && canEdit ? (
                <p className="text-xs text-muted-foreground">
                  Edit if needed, then submit again before the due date.
                </p>
              ) : status === "rejected" && editable && task.created_by_admin ? (
                <p className="text-xs text-muted-foreground">
                  Submit again before the due date.
                </p>
              ) : null}
            </>
          )}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        {!isEditing && (canEdit || canDelete) ? (
          <div className="flex shrink-0 items-center gap-1">
            {canEdit ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                aria-label="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
