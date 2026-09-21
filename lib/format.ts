export function formatCurrency(amount: number, currency = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Never throws: an invalid timestamp (NaN, e.g. from a cleared date input)
// renders as an em dash instead of crashing the page with
// "RangeError: Invalid time value".
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}

export function formatDateRange(start: number, end: number): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export interface MonthRange {
  start: number;
  end: number;
  label: string;
}

export function getMonthRange(referenceDate: Date = new Date()): MonthRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 1).getTime();
  const label = new Intl.DateTimeFormat("en-ZA", {
    month: "long",
    year: "numeric",
  }).format(referenceDate);
  return { start, end, label };
}
