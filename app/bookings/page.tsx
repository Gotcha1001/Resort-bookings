"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { BookingTable } from "@/app/components/bookings/BookingTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMonthRange } from "@/lib/format";

type StatusFilter = "all" | "active" | "cancelled" | "expired";

export default function BookingsPage() {
  const bookings = useQuery(api.bookings.listCurrentMonth, {});
  const venues = useQuery(api.venues.list, { includeArchived: true });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const venueNameById = useMemo(() => {
    const map = new Map<Id<"venues">, string>();
    for (const venue of venues ?? []) {
      map.set(venue._id, venue.name);
    }
    return map;
  }, [venues]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return undefined;
    const withVenueName = bookings.map((booking: Doc<"bookings">) => ({
      ...booking,
      venueName: venueNameById.get(booking.venueId),
    }));
    if (statusFilter === "all") return withVenueName;
    return withVenueName.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter, venueNameById]);

  const monthLabel = getMonthRange().label;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Bookings
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {monthLabel}
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredBookings === undefined ? (
        <p className="text-sm text-stone-500">Loading bookings…</p>
      ) : (
        <BookingTable
          bookings={filteredBookings}
          showVenueColumn
          emptyMessage="No bookings match this filter."
        />
      )}
    </div>
  );
}
