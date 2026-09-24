// app/(admin)/dashboard/page.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import { getMonthRange } from "@/lib/format";
import { FinancialSummaryCards } from "@/app/components/dashboard/FinancialSummaryCards";
import { BookingTable } from "@/app/components/bookings/BookingTable";

type BookingWithRoomName = Doc<"bookings"> & { roomName?: string };

export default function DashboardPage() {
  const summary = useQuery(api.bookings.financialSummary, {});
  const currentMonthBookings = useQuery(api.bookings.listCurrentMonth, {});
  const rooms = useQuery(api.rooms.list, { includeArchived: true });

  const monthLabel = getMonthRange().label;

  const roomNameById = useMemo(() => {
    const map = new Map<Id<"rooms">, string>();
    for (const room of rooms ?? []) {
      map.set(room._id, room.name);
    }
    return map;
  }, [rooms]);

  const recentBookings = useMemo((): BookingWithRoomName[] | undefined => {
    if (!currentMonthBookings) return undefined;

    return currentMonthBookings.slice(0, 6).map((booking) => ({
      ...booking,
      roomName: roomNameById.get(booking.roomId),
    }));
  }, [currentMonthBookings, roomNameById]);

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
            className="text-sm text-teal-600 hover:underline dark:text-teal-400"
          >
            View all
          </Link>
        </div>

        {recentBookings === undefined ? (
          <p className="text-sm text-stone-500">Loading bookings…</p>
        ) : (
          <BookingTable
            bookings={recentBookings}
            showRoomColumn
            emptyMessage="No bookings yet this month."
          />
        )}
      </div>
    </div>
  );
}
