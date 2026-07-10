import { cn } from "@/lib/utils";
import {
  addDaysToDateString,
  formatDateLabel,
} from "@/lib/utils/dates";
import { effectiveKpiFlag } from "@/lib/kpi/weekly-red-flags";
import { KPI_FLAG_CELL_STYLES } from "@/components/kpi/flag-badge";
import type { Tables } from "@/types/database.types";

type Flag = Tables<"daily_kpi_snapshots">["flag"];

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
  weeklyRedFlagDates = [],
}: {
  snapshots: Pick<Tables<"daily_kpi_snapshots">, "kpi_date" | "flag">[];
  endDate: string;
  days?: number;
  weeklyRedFlagDates?: string[];
}) {
  const flagByDate = new Map(snapshots.map((s) => [s.kpi_date, s.flag]));
  const weeklyRedDates = new Set(
    weeklyRedFlagDates.map((date) => date.slice(0, 10)),
  );

  const cells = Array.from({ length: days }, (_, i) => {
    const date = addDaysToDateString(endDate, -(days - 1 - i));
    const flag = effectiveKpiFlag(
      (flagByDate.get(date) ?? "none") as Flag | "none",
      date,
      weeklyRedDates,
    );
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
              "h-6 w-6 rounded-md transition-transform hover:scale-110",
              KPI_FLAG_CELL_STYLES[cell.flag],
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(["green", "yellow", "red", "no_tasks", "none"] as const).map(
          (flag) => (
            <span key={flag} className="flex items-center gap-1.5">
              <span
                className={cn("h-3.5 w-3.5 rounded-sm", KPI_FLAG_CELL_STYLES[flag])}
              />
              {CELL_LABEL[flag]}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
