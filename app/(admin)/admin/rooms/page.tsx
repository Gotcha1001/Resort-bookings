// app/(admin)/rooms/page.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RoomFormDialog } from "@/app/components/RoomFormDialog";
import { AdminRoomCard } from "@/app/components/AdminRoomCard";

export default function AdminRoomsPage() {
  // Include archived so admins can un-hide rooms
  const rooms = useQuery(api.rooms.list, { includeArchived: true });
  const currentMonthBookings = useQuery(api.bookings.listCurrentMonth, {});

  const activeCountByRoom = useMemo(() => {
    const map = new Map<Id<"rooms">, number>();
    if (!currentMonthBookings) return map;

    for (const booking of currentMonthBookings) {
      if (booking.status !== "active" && booking.status !== "pending_payment") {
        continue;
      }
      map.set(booking.roomId, (map.get(booking.roomId) ?? 0) + 1);
    }
    return map;
  }, [currentMonthBookings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Rooms & cottages
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Manage what guests can book on the public site.
          </p>
        </div>
        <RoomFormDialog />
      </div>

      {rooms === undefined && (
        <p className="text-sm text-stone-500">Loading rooms…</p>
      )}

      {rooms !== undefined && rooms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
          <p className="text-stone-600 dark:text-stone-300">
            No rooms or cottages yet. Add your first one to start taking
            bookings.
          </p>
          <div className="mt-4">
            <RoomFormDialog />
          </div>
        </div>
      )}

      {rooms !== undefined && rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <AdminRoomCard
              key={room._id}
              room={room}
              activeBookingCount={activeCountByRoom.get(room._id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
