// app/components/calendar/BookingCalendar.tsx
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

const EMPTY_SELECTION: BookingSelection = { start: null, end: null };

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
  /**
   * When true, the calendar is a pure occupancy view: no click-to-select,
   * no hover preview, no "book this range" affordance. Used on the admin
   * room-detail page, which only needs to show what's booked.
   */
  readOnly?: boolean;
  /** Required unless readOnly is true. */
  selection?: BookingSelection;
  range?: SelectedRange | null;
  onDayClick?: (day: Date) => void;
  onClearSelection?: () => void;
  onBookSelection?: () => void;
}

export function BookingCalendar({
  bookings,
  readOnly = false,
  selection = EMPTY_SELECTION,
  range = null,
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
  // Never applies in readOnly mode since there's nothing to select.
  const previewEnd =
    !readOnly &&
    start !== null &&
    end === null &&
    hoveredDay !== null &&
    hoveredDay > start
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
          const booking = bookingForDay(bookings, day);
          const isToday =
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate();
          const isStart = !readOnly && start === dayStart;
          const isEnd = !readOnly && end !== null && end === dayStart;
          const isInRange =
            !readOnly &&
            start !== null &&
            highlightEnd !== null &&
            dayStart > start &&
            dayStart <= highlightEnd;

          let stateClasses: string;
          if (booking) {
            // Semantic: booked stays amber regardless of brand theme
            stateClasses = readOnly
              ? "cursor-default bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
              : "cursor-not-allowed bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300";
          } else if (isStart || isEnd) {
            // Brand: selected endpoints follow the admin accent
            stateClasses = "bg-accent text-accent-foreground";
          } else if (isInRange) {
            stateClasses =
              "bg-accent/15 text-accent dark:bg-accent/25 dark:text-accent";
          } else if (readOnly) {
            // Semantic: available stays emerald
            stateClasses =
              "cursor-default bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
          } else {
            stateClasses =
              "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50";
          }

          return (
            <button
              key={dayStart}
              type="button"
              disabled={readOnly || booking !== undefined}
              onClick={
                readOnly || !onDayClick ? undefined : () => onDayClick(day)
              }
              onMouseEnter={
                readOnly ? undefined : () => setHoveredDay(dayStart)
              }
              aria-pressed={!readOnly && (isStart || isEnd || isInRange)}
              aria-label={`${formatDate(dayStart)}${
                booking ? `, booked by ${booking.guestName}` : ", available"
              }`}
              title={
                booking
                  ? `${booking.guestName} (${nightsLabel(booking.numberOfNights)})`
                  : "Available"
              }
              className={`flex h-12 flex-col items-center justify-center rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${stateClasses} ${
                isToday && !isStart && !isEnd ? "ring-2 ring-accent" : ""
              }`}
            >
              <span className="font-medium">{day.getDate()}</span>
              {booking && (
                <span className="max-w-full truncate px-1 text-[10px]">
                  {booking.guestName}
                </span>
              )}
              {!readOnly && !booking && isStart && (
                <span className="text-[10px]">Check-in</span>
              )}
              {!readOnly && !booking && !isStart && isEnd && (
                <span className="text-[10px]">Last night</span>
              )}
            </button>
          );
        })}
      </div>

      {readOnly ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Amber days are booked. This calendar is view-only — bookings are made
          from the customer-facing room page.
        </p>
      ) : range ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-accent/10 p-3 text-sm dark:bg-accent/15 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground">
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
        <p className="mt-4 text-xs text-muted-foreground">
          Click a green day to set the check-in, then click the last night of
          the stay.
        </p>
      )}

      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Booked
        </span>
        {!readOnly && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Selected
          </span>
        )}
      </div>
    </div>
  );
}
