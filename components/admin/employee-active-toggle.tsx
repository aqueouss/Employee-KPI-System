"use client";

import { useState, useTransition } from "react";

import { setEmployeeActiveAction } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";

export function EmployeeActiveToggle({
  employeeId,
  isActive,
}: {
  employeeId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await setEmployeeActiveAction(employeeId, !isActive);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={isActive ? "outline" : "default"}
        onClick={onClick}
        disabled={isPending}
      >
        {isPending ? "..." : isActive ? "Deactivate" : "Activate"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
