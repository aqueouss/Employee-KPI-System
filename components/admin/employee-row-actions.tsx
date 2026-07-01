"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  deleteEmployeeAction,
  setEmployeeActiveAction,
  setEmployeePayrollOnlyAction,
} from "@/actions/admin.actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingAction = "activate" | "deactivate" | "payroll" | "delete";

const ACTION_COPY: Record<
  PendingAction,
  {
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    confirmVariant: "default" | "destructive" | "secondary";
  }
> = {
  activate: {
    title: "Activate employee?",
    description: (name) =>
      `${name} will be able to sign in and appear as active across the system.`,
    confirmLabel: "Activate",
    confirmVariant: "default",
  },
  deactivate: {
    title: "Deactivate employee?",
    description: (name) =>
      `${name} will be marked inactive. They can still be reactivated later.`,
    confirmLabel: "Deactivate",
    confirmVariant: "secondary",
  },
  payroll: {
    title: "Convert to payroll only?",
    description: (name) =>
      `${name} will be removed from KPI, tasks, warnings, and rankings. Attendance and payroll will stay available.`,
    confirmLabel: "Convert to payroll only",
    confirmVariant: "secondary",
  },
  delete: {
    title: "Delete employee?",
    description: (name) =>
      `${name} will be permanently deleted along with their attendance, payroll, and KPI data. This cannot be undone.`,
    confirmLabel: "Delete permanently",
    confirmVariant: "destructive",
  },
};

export function EmployeeRowActions({
  employeeId,
  fullName,
  isActive,
  kpiTracked,
  isAdmin,
  isSelf,
}: {
  employeeId: string;
  fullName: string;
  isActive: boolean;
  kpiTracked: boolean;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function openConfirm(action: PendingAction) {
    setError(null);
    setMenuOpen(false);
    setPendingAction(action);
  }

  function closeConfirm() {
    if (isPending) return;
    setPendingAction(null);
    setError(null);
  }

  function runConfirmedAction() {
    if (!pendingAction) return;

    setError(null);
    startTransition(async () => {
      let result: { error?: string; success?: string };

      switch (pendingAction) {
        case "activate":
          result = await setEmployeeActiveAction(employeeId, true);
          break;
        case "deactivate":
          result = await setEmployeeActiveAction(employeeId, false);
          break;
        case "payroll":
          result = await setEmployeePayrollOnlyAction(employeeId);
          break;
        case "delete":
          result = await deleteEmployeeAction(employeeId);
          break;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setPendingAction(null);
      router.refresh();
    });
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const dialogCopy = pendingAction ? ACTION_COPY[pendingAction] : null;

  return (
    <>
      <div ref={menuRef} className="relative inline-flex justify-end">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label={`Manage ${fullName}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-md border border-border/70 bg-background shadow-lg">
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent/70"
              onClick={() =>
                openConfirm(isActive ? "deactivate" : "activate")
              }
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
            {!isAdmin && kpiTracked ? (
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent/70"
                onClick={() => openConfirm("payroll")}
              >
                Payroll only
              </button>
            ) : null}
            {!isAdmin ? (
              <button
                type="button"
                className={cn(
                  "flex w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 hover:text-destructive",
                )}
                onClick={() => openConfirm("delete")}
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {dialogCopy ? (
        <ConfirmDialog
          open
          title={dialogCopy.title}
          description={dialogCopy.description(fullName)}
          confirmLabel={dialogCopy.confirmLabel}
          confirmVariant={dialogCopy.confirmVariant}
          isPending={isPending}
          error={error}
          onConfirm={runConfirmedAction}
          onCancel={closeConfirm}
        />
      ) : null}
    </>
  );
}
