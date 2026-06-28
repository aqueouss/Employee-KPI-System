import { CalendarDays } from "lucide-react";

import {
  formatCalendarDateLabel,
  formatWeekdayLabel,
} from "@/lib/utils/dates";

export function DashboardDateBadge({ date }: { date: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-2.5 shadow-sm">
      <CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="text-sm font-semibold leading-tight">
          {formatWeekdayLabel(date)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatCalendarDateLabel(date)}
        </p>
      </div>
    </div>
  );
}
