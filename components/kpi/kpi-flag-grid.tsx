import { cn } from "@/lib/utils";
import {
  addDaysToDateString,
  formatDateLabel,
} from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

type Flag = Tables<"daily_kpi_snapshots">["flag"];

const CELL_STYLES: Record<Flag | "none", string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
  no_tasks: "bg-muted",
  none: "bg-muted/40",
};

const CELL_LABEL: Record<Flag | "none", string> = {
  green: "Green",
  yellow: "Yellow",
  red: "Red",
  no_tasks: "No tasks",
  none: "No data",
};

export function KpiFlagGrid({
  snapshots,
  endDate,
  days = 30,
}: {
  snapshots: Pick<Tables<"daily_kpi_snapshots">, "kpi_date" | "flag">[];
  endDate: string;
  days?: number;
}) {
  const flagByDate = new Map(snapshots.map((s) => [s.kpi_date, s.flag]));

  const cells = Array.from({ length: days }, (_, i) => {
    const date = addDaysToDateString(endDate, -(days - 1 - i));
    const flag = (flagByDate.get(date) ?? "none") as Flag | "none";
    return { date, flag };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${formatDateLabel(cell.date)} — ${CELL_LABEL[cell.flag]}`}
            className={cn(
              "h-5 w-5 rounded-sm",
              CELL_STYLES[cell.flag],
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-emerald-500" /> Green
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-400" /> Yellow
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-500" /> Red
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-muted" /> No tasks
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-muted/40" /> No data
        </span>
      </div>
    </div>
  );
}
