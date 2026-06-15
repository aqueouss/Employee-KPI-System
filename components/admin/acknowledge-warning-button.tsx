"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { acknowledgeWarningAction } from "@/actions/warning.actions";
import { Button } from "@/components/ui/button";

export function AcknowledgeWarningButton({
  warningId,
}: {
  warningId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await acknowledgeWarningAction(warningId);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={onClick} disabled={isPending}>
        <Check className="mr-1 h-4 w-4" />
        {isPending ? "..." : "Acknowledge"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
