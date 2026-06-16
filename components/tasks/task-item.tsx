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
import { Input } from "@/components/ui/input";
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

  // Employee can tick (submit) when not approved; ticking a submitted task
  // withdraws it. Approved tasks are locked.
  const canToggle = editable && !isApproved;
  const canEdit = editable && (status === "pending" || status === "rejected");
  const canDelete = editable && status === "pending";

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
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="flex items-center gap-3">
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
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
            isApproved && "border-emerald-600 bg-emerald-600 text-white",
            isSubmitted && "border-amber-500 bg-amber-500 text-white",
            (status === "pending" || status === "rejected") &&
              "border-input hover:border-emerald-600",
            !canToggle && "cursor-not-allowed opacity-70",
          )}
        >
          {isApproved ? <Check className="h-3.5 w-3.5" /> : null}
          {isSubmitted ? <Clock className="h-3 w-3" /> : null}
        </button>

        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              className="h-8"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
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
              className="h-8 w-8"
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
            <span
              className={cn(
                "flex-1 text-sm",
                isApproved && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </span>
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {canEdit || canDelete ? (
              <div className="flex items-center gap-1">
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
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      {status === "rejected" && task.review_note ? (
        <p className="mt-1.5 pl-8 text-xs text-destructive">
          Admin note: {task.review_note}
        </p>
      ) : null}

      {error ? (
        <p className="mt-1.5 pl-8 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
