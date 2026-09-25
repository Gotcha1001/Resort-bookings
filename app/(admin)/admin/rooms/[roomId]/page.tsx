// app/(admin)/admin/rooms/[roomId]/page.tsx
"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft, ImageOff } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { RoomFormDialog } from "@/app/components/RoomFormDialog";
import { BookingCalendar } from "@/app/components/calendar/BookingCalendar";
import { BookingTable } from "@/app/components/bookings/BookingTable";
import Image from "next/image";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function AdminRoomDetailPage({ params }: PageProps) {
  const { roomId } = use(params);
  const id = roomId as Id<"rooms">;

  const room = useQuery(api.rooms.get, { roomId: id });
  const bookings = useQuery(api.bookings.listByRoom, { roomId: id });

  if (room === undefined) {
    return <p className="text-sm text-stone-500">Loading room...</p>;
  }

  if (room === null) {
    return (
      <div className="space-y-4">
        <p className="text-stone-600 dark:text-stone-300">
          This room could not be found.
        </p>
        <Link href="/admin/rooms" className="text-teal-600 hover:underline">
          Back to rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/rooms"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
      >
        <ArrowLeft size={14} /> Back to rooms
      </Link>

      {/* Header: the actual room/cottage as it was uploaded — photo first,
          so an admin can confirm at a glance what the customer sees. */}
      {room.imageUrl ? (
        <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
          <Image
            src={room.imageUrl}
            alt={room.name}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 100vw, 100vw"
          />
        </div>
      ) : (
        <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600 sm:h-80">
          <ImageOff size={40} />
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
              {room.name}
            </h1>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              {room.roomType}
            </span>
            {room.isArchived && (
              <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                Hidden
              </span>
            )}
          </div>

          <p className="mt-1 max-w-xl text-sm text-stone-600 dark:text-stone-400">
            {room.description || "No description yet."}
          </p>

          {room.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-4 text-sm font-medium text-stone-900 dark:text-stone-100">
            <span>{formatCurrency(room.pricePerNight)} / night</span>
            <span className="font-normal text-stone-500">
              Sleeps {room.maxGuests}
            </span>
          </div>
        </div>

        {/* Only "Edit room" here — booking a room is a customer action,
            not something admins do from this screen. */}
        <div className="flex shrink-0 gap-2">
          <RoomFormDialog
            room={room}
            trigger={<Button variant="outline">Edit room</Button>}
          />
        </div>
      </div>

      {/* Read-only occupancy calendar: shows booked vs. available so an
          admin can see the room's schedule at a glance, but nothing is
          clickable/selectable here — there's no booking creation flow
          on the admin side. */}
      {bookings && <BookingCalendar bookings={bookings} readOnly />}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
          Bookings
        </h2>
        {bookings === undefined ? (
          <p className="text-sm text-stone-500">Loading bookings...</p>
        ) : (
          <BookingTable
            bookings={bookings}
            emptyMessage="No bookings for this room yet."
          />
        )}
      </div>
    </div>
  );
}
