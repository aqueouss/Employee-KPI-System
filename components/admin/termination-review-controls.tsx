"use client";

import { useState, useTransition } from "react";

import { updateTerminationReviewAction } from "@/actions/warning.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewStatus } from "@/types/domain";

export function TerminationReviewControls({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  function update(next: ReviewStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateTerminationReviewAction(
        reviewId,
        next,
        next === "resolved" ? notes : undefined,
      );
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "under_review" && status !== "resolved" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update("under_review")}
            disabled={isPending}
          >
            Start review
          </Button>
        ) : null}
        {status !== "resolved" ? (
          <Button
            size="sm"
            onClick={() => update("resolved")}
            disabled={isPending}
          >
            Resolve
          </Button>
        ) : null}
      </div>
      {status !== "resolved" ? (
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Resolution notes (optional)"
          className="h-8"
        />
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
