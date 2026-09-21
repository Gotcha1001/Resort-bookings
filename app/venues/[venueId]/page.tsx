"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BookingFormDialog } from "@/app/components/bookings/BookingFormDialog";
import { BookingTable } from "@/app/components/bookings/BookingTable";
import { BookingCalendar } from "@/app/components/calendar/BookingCalendar";
import { VenueFormDialog } from "@/app/components/venues/VenueFormDialog";
import { Button } from "@/components/ui/button";
import { useBookingSelection } from "@/hooks/useBookingSelection";
import { formatCurrency } from "@/lib/format";

interface VenuePageProps {
  params: Promise<{ venueId: string }>;
}

export default function VenuePage({ params }: VenuePageProps) {
  const { venueId } = use(params);
  const id = venueId as Id<"venues">;

  const venue = useQuery(api.venues.get, { venueId: id });
  const bookings = useQuery(api.bookings.listByVenue, { venueId: id });

  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const { selection, range, selectDay, clearSelection } =
    useBookingSelection(bookings);

  function handleDayClick(day: Date): void {
    const outcome = selectDay(day);
    if (outcome === "completed") {
      setIsBookingOpen(true);
    } else if (outcome === "blocked") {
      toast.error("That stay runs through days that are already booked");
    }
  }

  if (venue === undefined) {
    return <p className="text-sm text-stone-500">Loading venue…</p>;
  }

  if (venue === null) {
    return (
      <div className="space-y-4">
        <p className="text-stone-600 dark:text-stone-300">
          This venue could not be found.
        </p>
        <Link href="/venues" className="text-teal-600 hover:underline">
          Back to venues
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/venues"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
      >
        <ArrowLeft size={14} /> Back to venues
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {venue.name}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-stone-600 dark:text-stone-400">
            {venue.description || "No description yet."}
          </p>
          {venue.facilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {venue.facilities.map((facility) => (
                <span
                  key={facility}
                  className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                >
                  {facility}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-sm font-medium text-stone-900 dark:text-stone-100">
            <span>{formatCurrency(venue.pricePerDay)} / night</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <VenueFormDialog
            venue={venue}
            trigger={<Button variant="outline">Edit venue</Button>}
          />
          <Button className="gap-2" onClick={() => setIsBookingOpen(true)}>
            <CalendarPlus size={16} />
            Book this venue
          </Button>
        </div>
      </div>

      {bookings && (
        <BookingCalendar
          bookings={bookings}
          selection={selection}
          range={range}
          onDayClick={handleDayClick}
          onClearSelection={clearSelection}
          onBookSelection={() => setIsBookingOpen(true)}
        />
      )}

      <BookingFormDialog
        venue={venue}
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        initialStartDate={range?.startDate ?? null}
        initialNumberOfDays={range?.numberOfDays ?? 1}
        bookings={bookings ?? []}
        onBooked={clearSelection}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
          Bookings
        </h2>
        {bookings === undefined ? (
          <p className="text-sm text-stone-500">Loading bookings…</p>
        ) : (
          <BookingTable
            bookings={bookings}
            emptyMessage="No bookings for this venue yet."
          />
        )}
      </div>
    </div>
  );
}
