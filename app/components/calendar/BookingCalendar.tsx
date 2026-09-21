"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useMonthNavigation } from "@/hooks/use-month-navigation";
import type {
  BookingSelection,
  SelectedRange,
} from "@/hooks/useBookingSelection";
import { startOfDay } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { calculateEndDate } from "@/lib/pricing";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function bookingForDay(
  bookings: Doc<"bookings">[],
  day: Date,
): Doc<"bookings"> | undefined {
  const dayStart = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
  ).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return bookings.find(
    (booking) =>
      booking.status === "active" &&
      booking.startDate < dayEnd &&
      booking.endDate > dayStart,
  );
}

function nightsLabel(count: number): string {
  return `${count} night${count === 1 ? "" : "s"}`;
}

interface BookingCalendarProps {
  bookings: Doc<"bookings">[];
  selection: BookingSelection;
  range: SelectedRange | null;
  onDayClick: (day: Date) => void;
  onClearSelection: () => void;
  onBookSelection: () => void;
}

export function BookingCalendar({
  bookings,
  selection,
  range,
  onDayClick,
  onClearSelection,
  onBookSelection,
}: BookingCalendarProps) {
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
  const today = new Date();

  const { start, end } = selection;
  // While only the start is picked, preview the stay up to the hovered day.
  const previewEnd =
    start !== null && end === null && hoveredDay !== null && hoveredDay > start
      ? hoveredDay
      : null;
  const highlightEnd = end ?? previewEnd;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">
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

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
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
          const booking = bookingForDay(bookings, day);
          const isToday =
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate();

          const isStart = start === dayStart;
          const isEnd = end !== null && end === dayStart;
          const isInRange =
            start !== null &&
            highlightEnd !== null &&
            dayStart > start &&
            dayStart <= highlightEnd;

          let stateClasses: string;
          if (booking) {
            stateClasses =
              "cursor-not-allowed bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300";
          } else if (isStart || isEnd) {
            stateClasses =
              "bg-teal-600 text-white dark:bg-teal-500 dark:text-stone-950";
          } else if (isInRange) {
            stateClasses =
              "bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-100";
          } else {
            stateClasses =
              "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50";
          }

          return (
            <button
              key={dayStart}
              type="button"
              disabled={booking !== undefined}
              onClick={() => onDayClick(day)}
              onMouseEnter={() => setHoveredDay(dayStart)}
              aria-pressed={isStart || isEnd || isInRange}
              aria-label={`${formatDate(dayStart)}${
                booking ? `, booked by ${booking.customerName}` : ", available"
              }`}
              title={
                booking
                  ? `${booking.customerName} (${nightsLabel(booking.numberOfDays)})`
                  : "Available"
              }
              className={`flex h-12 flex-col items-center justify-center rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${stateClasses} ${
                isToday && !isStart && !isEnd ? "ring-2 ring-teal-500" : ""
              }`}
            >
              <span className="font-medium">{day.getDate()}</span>
              {booking && (
                <span className="max-w-full truncate px-1 text-[10px]">
                  {booking.customerName}
                </span>
              )}
              {!booking && isStart && (
                <span className="text-[10px]">Check-in</span>
              )}
              {!booking && !isStart && isEnd && (
                <span className="text-[10px]">Last night</span>
              )}
            </button>
          );
        })}
      </div>

      {range ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-teal-50 p-3 text-sm dark:bg-teal-950/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-stone-700 dark:text-stone-200">
            {end === null ? (
              <>
                Check-in{" "}
                <span className="font-semibold">
                  {formatDate(range.startDate)}
                </span>
                . Click the last night of the stay, or book just one night.
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {formatDate(range.startDate)}
                </span>{" "}
                to check-out{" "}
                <span className="font-semibold">
                  {formatDate(
                    calculateEndDate(range.startDate, range.numberOfDays),
                  )}
                </span>{" "}
                ({nightsLabel(range.numberOfDays)})
              </>
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              Clear
            </Button>
            <Button size="sm" onClick={onBookSelection}>
              Book {nightsLabel(range.numberOfDays)}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-stone-500">
          Click a green day to set the check-in, then click the last night of
          the stay.
        </p>
      )}

      <div className="mt-4 flex gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Selected
        </span>
      </div>
    </div>
  );
}
