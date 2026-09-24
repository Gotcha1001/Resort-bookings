// hooks/usePublicDateSelection.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { addDays, daysBetween, startOfDay } from "@/lib/dates";
import type {
  BookingSelection,
  SelectedRange,
} from "@/hooks/useBookingSelection";

/*
  Customer-side date picking. Unlike useBookingSelection it does not need
  full booking documents (which contain guest details and need admin auth).
  It takes the anonymous ranges from api.bookings.getBookedRanges, which the
  server has already limited to active + pending_payment stays.

  Same convention as the rest of the app:
    - a range is [startDate, endDate): endDate is the CHECK-OUT day
    - `selection.start` is the first night, `selection.end` the LAST night
    - every value is a local-midnight timestamp
*/

export interface BookedRange {
  startDate: number;
  endDate: number;
}

export type PublicSelectOutcome =
  | "started" // check-in chosen, waiting for the last night
  | "completed" // full range chosen
  | "blocked" // range would run through a booked night
  | "past"; // day is before today

export interface PublicDateSelection {
  selection: BookingSelection;
  /** With only a start picked this is a 1-night stay. */
  range: SelectedRange | null;
  /** Every booked NIGHT as a local-midnight timestamp. */
  bookedDays: ReadonlySet<number>;
  selectDay: (day: Date) => PublicSelectOutcome;
  clearSelection: () => void;
}

function buildBookedDays(ranges: ReadonlyArray<BookedRange>): Set<number> {
  const days = new Set<number>();
  for (const range of ranges) {
    for (
      let day = startOfDay(new Date(range.startDate));
      day < range.endDate;
      day = addDays(day, 1)
    ) {
      days.add(day);
    }
  }
  return days;
}

export function usePublicDateSelection(
  ranges: ReadonlyArray<BookedRange> | undefined,
): PublicDateSelection {
  const [selection, setSelection] = useState<BookingSelection>({
    start: null,
    end: null,
  });

  const bookedDays = useMemo(() => buildBookedDays(ranges ?? []), [ranges]);

  const selectDay = useCallback(
    (day: Date): PublicSelectOutcome => {
      const dayStart = startOfDay(day);
      if (dayStart < startOfDay(new Date())) return "past";

      const { start, end } = selection;

      // Nothing picked, a full range already chosen, or the click is before
      // the current start: begin a fresh selection from this day.
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

  return { selection, range, bookedDays, selectDay, clearSelection };
}
