"use client";

import { useMemo, useState } from "react";

export interface MonthNavigation {
  viewedDate: Date;
  monthLabel: string;
  monthStart: number;
  monthEnd: number;
  daysInMonth: Date[];
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
}

export function useMonthNavigation(
  initialDate: Date = new Date(),
): MonthNavigation {
  const [viewedDate, setViewedDate] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const monthStart = useMemo(
    () =>
      new Date(viewedDate.getFullYear(), viewedDate.getMonth(), 1).getTime(),
    [viewedDate],
  );
  const monthEnd = useMemo(
    () =>
      new Date(
        viewedDate.getFullYear(),
        viewedDate.getMonth() + 1,
        1,
      ).getTime(),
    [viewedDate],
  );
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-ZA", {
        month: "long",
        year: "numeric",
      }).format(viewedDate),
    [viewedDate],
  );
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const totalDays = new Date(
      viewedDate.getFullYear(),
      viewedDate.getMonth() + 1,
      0,
    ).getDate();
    for (let day = 1; day <= totalDays; day += 1) {
      days.push(new Date(viewedDate.getFullYear(), viewedDate.getMonth(), day));
    }
    return days;
  }, [viewedDate]);

  function goToPreviousMonth(): void {
    setViewedDate(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }
  function goToNextMonth(): void {
    setViewedDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }
  function goToToday(): void {
    const today = new Date();
    setViewedDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return {
    viewedDate,
    monthLabel,
    monthStart,
    monthEnd,
    daysInMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  };
}
