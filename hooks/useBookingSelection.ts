"use client";

import { useCallback, useMemo, useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import { addDays, daysBetween, startOfDay } from "@/lib/dates";

/**
 * `start` is the first night of the stay, `end` is the LAST night (inclusive).
 * Both are local-midnight timestamps. Check-out is the day after `end`.
 */
export interface BookingSelection {
  start: number | null;
  end: number | null;
}

export interface SelectedRange {
  startDate: number;
  numberOfDays: number;
}

export type SelectDayOutcome =
  | "started" // first click: check-in day highlighted, waiting for the last night
  | "completed" // second click: a full range is chosen
  | "blocked"; // the range would run through an already-booked day

export interface BookingSelectionState {
  selection: BookingSelection;
  /** The chosen stay. With only a start picked, this is a 1-night stay. */
  range: SelectedRange | null;
  selectDay: (day: Date) => SelectDayOutcome;
  clearSelection: () => void;
}

function buildBookedDays(
  bookings: ReadonlyArray<Doc<"bookings">>,
): Set<number> {
  const days = new Set<number>();
  for (const booking of bookings) {
    if (booking.status !== "active") continue;
    for (
      let day = startOfDay(new Date(booking.startDate));
      day < booking.endDate;
      day = addDays(day, 1)
    ) {
      days.add(day);
    }
  }
  return days;
}

export function useBookingSelection(
  bookings: ReadonlyArray<Doc<"bookings">> | undefined,
): BookingSelectionState {
  const [selection, setSelection] = useState<BookingSelection>({
    start: null,
    end: null,
  });

  const bookedDays = useMemo(() => buildBookedDays(bookings ?? []), [bookings]);

  const selectDay = useCallback(
    (day: Date): SelectDayOutcome => {
      const dayStart = startOfDay(day);
      const { start, end } = selection;

      // Nothing picked yet, a full range is already chosen, or the click is
      // before the current start: begin a new selection from this day.
      if (start === null || end !== null || dayStart < start) {
        if (bookedDays.has(dayStart)) return "blocked";
        setSelection({ start: dayStart, end: null });
        return "started";
      }

      // Clicking the start day again (or any later day) sets the last night.
      for (
        let cursor = start;
        cursor <= dayStart;
        cursor = addDays(cursor, 1)
      ) {
        if (bookedDays.has(cursor)) return "blocked";
      }
      setSelection({ start, end: dayStart });
      return "completed";
    },
    [bookedDays, selection],
  );

  const clearSelection = useCallback((): void => {
    setSelection({ start: null, end: null });
  }, []);

  const range = useMemo<SelectedRange | null>(() => {
    if (selection.start === null) return null;
    const lastNight = selection.end ?? selection.start;
    return {
      startDate: selection.start,
      numberOfDays: daysBetween(selection.start, lastNight) + 1,
    };
  }, [selection]);

  return { selection, range, selectDay, clearSelection };
}
