import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDaysToDateString,
  endOfMonthDateString,
  getTodayDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";

export function MonthNav({
  basePath,
  monthStart,
}: {
  basePath: string;
  monthStart: string;
}) {
  const prev = startOfMonthDateString(addDaysToDateString(monthStart, -1));
  const next = startOfMonthDateString(
    addDaysToDateString(endOfMonthDateString(monthStart), 1),
  );

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="icon">
        <Link href={`${basePath}?month=${prev}`}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <span className="min-w-[7rem] text-center text-sm font-medium">
        {monthStart.slice(0, 7)}
      </span>
      <Button asChild variant="outline" size="icon">
        <Link href={`${basePath}?month=${next}`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link
          href={`${basePath}?month=${startOfMonthDateString(getTodayDateString())}`}
        >
          Today
        </Link>
      </Button>
    </div>
  );
}
