const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateEndDate(
  startDate: number,
  numberOfDays: number,
): number {
  return startDate + numberOfDays * MS_PER_DAY;
}

export function calculateAmount(
  numberOfDays: number,
  pricePerDay: number,
): number {
  return numberOfDays * pricePerDay;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}
