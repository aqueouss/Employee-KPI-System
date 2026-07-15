"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { SalesReportPeriod } from "@/lib/sales/sales-report";

const PERIODS: Array<{ value: SalesReportPeriod; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
  { value: "all_time", label: "Since joining" },
];

export function SalesPeriodFilter({
  period,
  anchorDate,
  basePath,
}: {
  period: SalesReportPeriod;
  anchorDate: string;
  basePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const showAnchor = period !== "all_time";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Report period</label>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={period === item.value ? "default" : "outline"}
              disabled={isPending}
              onClick={() =>
                update({
                  period: item.value,
                  anchor: period === "all_time" ? anchorDate : searchParams.get("anchor"),
                })
              }
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {showAnchor ? (
        <div className="space-y-1.5">
          <label htmlFor="sales-anchor" className="text-xs font-medium text-muted-foreground">
            Reference date
          </label>
          <input
            id="sales-anchor"
            type="date"
            defaultValue={anchorDate}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(e) => update({ anchor: e.target.value })}
          />
        </div>
      ) : null}

      <Button asChild variant="ghost" size="sm" className="sm:ml-auto">
        <Link href={basePath}>Reset view</Link>
      </Button>
    </div>
  );
}
