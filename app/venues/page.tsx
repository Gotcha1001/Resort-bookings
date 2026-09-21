"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { VenueCard } from "@/app/components/venues/VenueCard";
import { VenueFormDialog } from "@/app/components/venues/VenueFormDialog";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export default function VenuesPage() {
  const venues = useQuery(api.venues.list, {});
  const currentMonthBookings = useQuery(api.bookings.listCurrentMonth, {});

  const activeCountByVenue = new Map<Id<"venues">, number>();
  if (currentMonthBookings) {
    for (const booking of currentMonthBookings) {
      if (booking.status !== "active") continue;
      activeCountByVenue.set(
        booking.venueId,
        (activeCountByVenue.get(booking.venueId) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Rooms &amp; venues
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Every room or place guests can book.
          </p>
        </div>
        <VenueFormDialog />
      </div>

      {venues === undefined && (
        <p className="text-sm text-stone-500">Loading venues…</p>
      )}

      {venues && venues.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
          <p className="text-stone-600 dark:text-stone-300">
            No rooms or venues yet. Add your first one to start taking bookings.
          </p>
        </div>
      )}

      {venues && venues.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue: Doc<"venues">) => (
            <VenueCard
              key={venue._id}
              venue={venue}
              activeBookingCount={activeCountByVenue.get(venue._id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
