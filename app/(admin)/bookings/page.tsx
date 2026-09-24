// app/(admin)/bookings/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMonthRange } from "@/lib/format";
import { BookingTable } from "@/app/components/bookings/BookingTable";

type StatusFilter =
  | "all"
  | "pending_payment"
  | "active"
  | "cancelled"
  | "expired";

type BookingWithRoomName = Doc<"bookings"> & { roomName?: string };

export default function AdminBookingsPage() {
  const bookings = useQuery(api.bookings.listCurrentMonth, {});
  const rooms = useQuery(api.rooms.list, { includeArchived: true });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const roomNameById = useMemo(() => {
    const map = new Map<Id<"rooms">, string>();
    for (const room of rooms ?? []) {
      map.set(room._id, room.name);
    }
    return map;
  }, [rooms]);

  const filteredBookings = useMemo((): BookingWithRoomName[] | undefined => {
    if (!bookings) return undefined;

    const withRoomName: BookingWithRoomName[] = bookings.map((booking) => ({
      ...booking,
      roomName: roomNameById.get(booking.roomId),
    }));

    if (statusFilter === "all") return withRoomName;
    return withRoomName.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter, roomNameById]);

  const monthLabel = getMonthRange().label;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Bookings
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {monthLabel} · paid status updates automatically via PayFast
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_payment">Pending payment</SelectItem>
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
          showRoomColumn
          emptyMessage="No bookings match this filter."
        />
      )}
    </div>
  );
}
