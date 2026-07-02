"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addDaysToDateString,
  getTodayDateString,
} from "@/lib/utils/dates";

export function AttendanceDatePicker({
  date,
  maxDate = getTodayDateString(),
}: {
  date: string;
  maxDate?: string;
}) {
  const router = useRouter();
  const isToday = date === maxDate;
  const prevDate = addDaysToDateString(date, -1);
  const nextDate = addDaysToDateString(date, 1);
  const canGoNext = nextDate <= maxDate;

  function navigate(next: string) {
    const params = new URLSearchParams();
    if (next !== maxDate) {
      params.set("date", next);
    }
    const query = params.toString();
    router.push(query ? `/admin?${query}` : "/admin");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => navigate(prevDate)}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Input
        type="date"
        value={date}
        max={maxDate}
        onChange={(event) => {
          const value = event.target.value;
          if (!value || value > maxDate) return;
          navigate(value);
        }}
        className="h-9 w-[10.5rem]"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => canGoNext && navigate(nextDate)}
        disabled={!canGoNext}
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday ? (
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">Today</Link>
        </Button>
      ) : null}
    </div>
  );
}
