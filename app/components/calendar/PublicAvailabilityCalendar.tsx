// app/components/calendar/PublicAvailabilityCalendar.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthNavigation } from "@/hooks/use-month-navigation";
import type {
  BookingSelection,
  SelectedRange,
} from "@/hooks/useBookingSelection";
import { addDays, startOfDay } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nightsLabel(count: number): string {
  return `${count} night${count === 1 ? "" : "s"}`;
}

interface PublicAvailabilityCalendarProps {
  /** From usePublicDateSelection. Anonymous: no guest names anywhere. */
  bookedDays: ReadonlySet<number>;
  selection: BookingSelection;
  range: SelectedRange | null;
  onDayClick: (day: Date) => void;
  onClearSelection: () => void;
  onContinue: () => void;
  /** When given, the selection banner shows an estimated total. */
  pricePerNight?: number;
  continueLabel?: string;
}

export function PublicAvailabilityCalendar({
  bookedDays,
  selection,
  range,
  onDayClick,
  onClearSelection,
  onContinue,
  pricePerNight,
  continueLabel = "Continue",
}: PublicAvailabilityCalendarProps) {
  const {
    viewedDate,
    monthLabel,
    daysInMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useMonthNavigation();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const leadingBlanks = new Date(
    viewedDate.getFullYear(),
    viewedDate.getMonth(),
    1,
  ).getDay();
  const todayStart = startOfDay(new Date());
  const { start, end } = selection;

  const previewEnd =
    start !== null && end === null && hoveredDay !== null && hoveredDay > start
      ? hoveredDay
      : null;
  const highlightEnd = end ?? previewEnd;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 dark:bg-surface">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button size="sm" variant="ghost" onClick={goToToday}>
            Today
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-1"
        onMouseLeave={() => setHoveredDay(null)}
      >
        {Array.from({ length: leadingBlanks }).map((_, index) => (
          <div key={`blank-${index}`} />
        ))}

        {daysInMonth.map((day) => {
          const dayStart = startOfDay(day);
          const isBooked = bookedDays.has(dayStart);
          const isPast = dayStart < todayStart;
          const isToday = dayStart === todayStart;
          const isStart = start === dayStart;
          const isEnd = end !== null && end === dayStart;
          const isInRange =
            start !== null &&
            highlightEnd !== null &&
            dayStart > start &&
            dayStart <= highlightEnd;

          let stateClasses: string;
          if (isPast) {
            stateClasses = "cursor-not-allowed text-muted-foreground/40";
          } else if (isBooked) {
            stateClasses =
              "cursor-not-allowed bg-amber-100 text-amber-900 line-through dark:bg-amber-950 dark:text-amber-300";
          } else if (isStart || isEnd) {
            stateClasses = "bg-accent text-accent-foreground";
          } else if (isInRange) {
            stateClasses =
              "bg-accent/15 text-accent dark:bg-accent/25 dark:text-accent";
          } else {
            stateClasses =
              "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50";
          }

          return (
            <button
              key={dayStart}
              type="button"
              disabled={isPast || isBooked}
              onClick={() => onDayClick(day)}
              onMouseEnter={() => setHoveredDay(dayStart)}
              aria-pressed={isStart || isEnd || isInRange}
              aria-label={`${formatDate(dayStart)}, ${
                isPast ? "unavailable" : isBooked ? "booked" : "available"
              }`}
              className={`flex h-12 flex-col items-center justify-center rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${stateClasses} ${
                isToday && !isStart && !isEnd ? "ring-2 ring-accent" : ""
              }`}
            >
              <span className="font-medium">{day.getDate()}</span>
              {!isBooked && !isPast && isStart && (
                <span className="text-[10px]">Check-in</span>
              )}
              {!isBooked && !isPast && !isStart && isEnd && (
                <span className="text-[10px]">Last night</span>
              )}
            </button>
          );
        })}
      </div>

      {range ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-accent/10 p-3 text-sm dark:bg-accent/15 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground">
            {end === null ? (
              <>
                Check-in{" "}
                <span className="font-semibold">
                  {formatDate(range.startDate)}
                </span>
                . Pick your last night, or continue with one night.
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {formatDate(range.startDate)}
                </span>{" "}
                to check-out{" "}
                <span className="font-semibold">
                  {formatDate(addDays(range.startDate, range.numberOfDays))}
                </span>{" "}
                ({nightsLabel(range.numberOfDays)})
              </>
            )}
            {pricePerNight !== undefined && (
              <>
                {" "}
                &middot;{" "}
                <span className="font-semibold">
                  {formatCurrency(range.numberOfDays * pricePerNight)}
                </span>
              </>
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              Clear
            </Button>
            <Button size="sm" onClick={onContinue}>
              {continueLabel}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Tap a green day for your check-in, then tap your last night.
        </p>
      )}

      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Your stay
        </span>
      </div>
    </div>
  );
}
