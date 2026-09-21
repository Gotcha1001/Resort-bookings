// lib/dates.ts
//
// All timestamps in the booking flow are "local midnight" values: the moment
// a calendar day starts in the browser's timezone. Keeping everything on that
// one convention is what makes calendar clicks, the date input and the
// database line up.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Local midnight of the day the given Date falls on. */
export function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

/** Local midnight `days` calendar days after `timestamp` (can be negative). */
export function addDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  ).getTime();
}

/** Whole calendar days from `from` to `to` (both local midnights). */
export function daysBetween(from: number, to: number): number {
  return Math.round((to - from) / MS_PER_DAY);
}

/**
 * Formats a timestamp as `YYYY-MM-DD` for an <input type="date"> using the
 * LOCAL date. (`toISOString()` converts to UTC first, which shifts the date
 * back a day for anyone ahead of UTC, e.g. South Africa.)
 */
export function toDateInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses an <input type="date"> value into local midnight. Returns null for
 * an empty or invalid value instead of producing an Invalid Date.
 */
export function parseDateInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date.getTime();
}
