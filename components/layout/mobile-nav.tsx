"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/domain";

export function MobileNav({
  role,
  kpiTracked = true,
  salesAccess = false,
}: {
  role: UserRole;
  kpiTracked?: boolean;
  salesAccess?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-20 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-14 z-30 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border/60 bg-card/95 p-4 shadow-xl shadow-primary/10 backdrop-blur-xl">
            <DashboardNav
              role={role}
              kpiTracked={kpiTracked}
              salesAccess={salesAccess}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
