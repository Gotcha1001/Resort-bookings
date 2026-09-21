"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FinancialSummaryCards } from "@/app/components/dashboard/FinancialSummaryCards";
import { BookingTable } from "@/app/components/bookings/BookingTable";
import { getMonthRange } from "@/lib/format";

export default function DashboardPage() {
  const summary = useQuery(api.bookings.financialSummary, {});
  const currentMonthBookings = useQuery(api.bookings.listCurrentMonth, {});
  const venues = useQuery(api.venues.list, { includeArchived: true });

  const monthLabel = getMonthRange().label;

  const venueNameById = useMemo(() => {
    const map = new Map<Id<"venues">, string>();
    for (const venue of venues ?? []) {
      map.set(venue._id, venue.name);
    }
    return map;
  }, [venues]);

  const recentBookings = useMemo(() => {
    if (!currentMonthBookings) return undefined;
    return currentMonthBookings
      .slice(0, 6)
      .map((booking) => ({
        ...booking,
        venueName: venueNameById.get(booking.venueId),
      }));
  }, [currentMonthBookings, venueNameById]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          Dashboard
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Overview for {monthLabel}
        </p>
      </div>

      {summary === undefined ? (
        <p className="text-sm text-stone-500">Loading summary…</p>
      ) : (
        <FinancialSummaryCards summary={summary} monthLabel={monthLabel} />
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Recent bookings
          </h2>
          <Link
            href="/bookings"
            className="text-sm text-teal-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {recentBookings === undefined ? (
          <p className="text-sm text-stone-500">Loading bookings…</p>
        ) : (
          <BookingTable
            bookings={recentBookings}
            showVenueColumn
            emptyMessage="No bookings yet this month."
          />
        )}
      </div>
    </div>
  );
}
