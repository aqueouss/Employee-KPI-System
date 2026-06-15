"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDaysToDateString,
  formatDateLabel,
} from "@/lib/utils/dates";

export function DateNavigator({
  date,
  today,
}: {
  date: string;
  today: string;
}) {
  const router = useRouter();

  function go(target: string) {
    router.push(`/employee/tasks?date=${target}`);
  }

  const isToday = date === today;

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => go(addDaysToDateString(date, -1))}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center">
        <span className="text-sm font-medium">{formatDateLabel(date)}</span>
        {isToday ? (
          <span className="text-xs text-muted-foreground">Today</span>
        ) : (
          <button
            type="button"
            onClick={() => go(today)}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Jump to today
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => go(addDaysToDateString(date, 1))}
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => go(today)}
        aria-label="Today"
      >
        <CalendarDays className="h-4 w-4" />
      </Button>
    </div>
  );
}
