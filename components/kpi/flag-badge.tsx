import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KpiFlag } from "@/types/domain";

const FLAG_CONFIG: Record<
  KpiFlag,
  { label: string; className: string }
> = {
  green: {
    label: "Green",
    className:
      "border-transparent bg-emerald-600 text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950",
  },
  yellow: {
    label: "Yellow",
    className:
      "border-transparent bg-amber-500 text-amber-950 shadow-sm dark:bg-amber-300 dark:text-amber-950",
  },
  red: {
    label: "Red",
    className:
      "border-transparent bg-red-600 text-white shadow-sm dark:bg-red-400 dark:text-red-950",
  },
  no_tasks: {
    label: "No tasks",
    className:
      "border-transparent bg-stone-500 text-white shadow-sm dark:bg-stone-400 dark:text-stone-950",
  },
};

export function FlagBadge({ flag }: { flag: KpiFlag }) {
  const config = FLAG_CONFIG[flag];
  return (
    <Badge className={cn(config.className)}>{config.label}</Badge>
  );
}

export const KPI_FLAG_CELL_STYLES: Record<KpiFlag | "none", string> = {
  green:
    "bg-emerald-600 shadow-sm ring-1 ring-emerald-700/40 dark:bg-emerald-400 dark:ring-emerald-300/50",
  yellow:
    "bg-amber-500 shadow-sm ring-1 ring-amber-600/40 dark:bg-amber-300 dark:ring-amber-200/50",
  red: "bg-red-600 shadow-sm ring-1 ring-red-700/40 dark:bg-red-400 dark:ring-red-300/50",
  no_tasks:
    "bg-stone-500 shadow-sm ring-1 ring-stone-600/40 dark:bg-stone-400 dark:ring-stone-300/50",
  none: "border border-dashed border-border bg-muted/50 dark:bg-muted/30",
};
