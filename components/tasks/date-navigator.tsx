"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDaysToDateString,
  formatDateLabel,
} from "@/lib/utils/dates";

function DatePickerTrigger({
  date,
  onChange,
  children,
  className,
  ariaLabel,
}: {
  date: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // fall through
      }
    }
    input.click();
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="pointer-events-none">{children}</div>
      <button
        type="button"
        onClick={openPicker}
        className="absolute inset-0 cursor-pointer rounded-md opacity-0"
        aria-label={ariaLabel}
      />
      <input
        ref={inputRef}
        type="date"
        value={date}
        onChange={(e) => {
          const next = e.target.value;
          if (next) onChange(next);
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}

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

      <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
        <DatePickerTrigger
          date={date}
          onChange={go}
          className="w-full"
          ariaLabel="Pick a date"
        >
          <div className="flex flex-col items-center rounded-md px-2 py-1 transition-colors hover:bg-accent/60">
            <span className="text-sm font-medium">{formatDateLabel(date)}</span>
            <span className="text-xs text-muted-foreground">
              {isToday ? "Today · tap to change" : "Tap to pick date"}
            </span>
          </div>
        </DatePickerTrigger>
        {!isToday ? (
          <button
            type="button"
            onClick={() => go(today)}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Jump to today
          </button>
        ) : null}
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

      <DatePickerTrigger date={date} onChange={go} ariaLabel="Open calendar">
        <Button type="button" variant="outline" size="icon" tabIndex={-1}>
          <CalendarDays className="h-4 w-4" />
        </Button>
      </DatePickerTrigger>
    </div>
  );
}
