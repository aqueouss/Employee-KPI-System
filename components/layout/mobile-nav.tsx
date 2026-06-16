"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/domain";

export function MobileNav({ role }: { role: UserRole }) {
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
          <div className="fixed inset-x-0 top-14 z-30 border-b bg-card p-4 shadow-lg">
            <div key={pathname} onClick={() => setOpen(false)}>
              <DashboardNav role={role} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
