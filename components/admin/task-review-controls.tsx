"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { reviewTaskAction } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TaskReviewControls({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function review(decision: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const res = await reviewTaskAction(taskId, decision, note.trim());
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (shown on reject)"
        maxLength={500}
        className="h-9 sm:w-64"
        disabled={isPending}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => review("approve")}
          disabled={isPending}
        >
          <Check className="mr-1 h-4 w-4" />
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => review("reject")}
          disabled={isPending}
        >
          <X className="mr-1 h-4 w-4" />
          Reject
        </Button>
      </div>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
