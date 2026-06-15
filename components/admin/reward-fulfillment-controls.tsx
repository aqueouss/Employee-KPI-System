"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { updateRewardStatusAction } from "@/actions/reward.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RewardFulfillmentControls({
  rewardId,
}: {
  rewardId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  function update(status: "issued" | "declined") {
    setError(null);
    startTransition(async () => {
      const res = await updateRewardStatusAction(rewardId, status, notes);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="h-8"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => update("issued")} disabled={isPending}>
          <Check className="mr-1 h-4 w-4" />
          Issue
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => update("declined")}
          disabled={isPending}
        >
          <X className="mr-1 h-4 w-4" />
          Decline
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
