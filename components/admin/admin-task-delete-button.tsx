"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { adminDeleteTaskAction } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";

export function AdminTaskDeleteButton({
  taskId,
  compact = false,
}: {
  taskId: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await adminDeleteTaskAction(taskId);
      if (res.error) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="btn-destructive-hover border dark:bg-destructive/15 dark:border-destructive/50"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "Deleting..." : "Confirm delete"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="btn-destructive-hover border dark:bg-destructive/15 dark:border-destructive/50"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        aria-label="Delete task"
      >
        <Trash2 className="mr-1 h-4 w-4" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="btn-destructive-hover h-9 w-9 border dark:bg-destructive/15 dark:border-destructive/50"
        onClick={() => setConfirming(true)}
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
