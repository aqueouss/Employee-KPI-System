"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/domain";

export function MobileNav({
  role,
  kpiTracked = true,
}: {
  role: UserRole;
  kpiTracked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <>
          <div
            className="fixed inset-0 top-14 z-20 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-14 z-30 border-b border-border/60 bg-card/90 p-4 shadow-xl shadow-primary/10 backdrop-blur-xl">
            <div key={pathname} onClick={() => setOpen(false)}>
              <DashboardNav role={role} kpiTracked={kpiTracked} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
