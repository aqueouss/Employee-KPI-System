"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setEmployeePayrollOnlyAction } from "@/actions/admin.actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export function EmployeePayrollOnlyButton({
  employeeId,
  fullName,
}: {
  employeeId: string;
  fullName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await setEmployeePayrollOnlyAction(employeeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={isPending}
      >
        Convert to payroll only
      </Button>

      <ConfirmDialog
        open={open}
        title="Convert to payroll only?"
        description={`${fullName} will be removed from KPI, tasks, warnings, and rankings. Attendance and payroll will stay available.`}
        confirmLabel="Convert to payroll only"
        confirmVariant="secondary"
        isPending={isPending}
        error={error}
        onConfirm={onConfirm}
        onCancel={() => {
          if (isPending) return;
          setOpen(false);
          setError(null);
        }}
      />
    </>
  );
}
