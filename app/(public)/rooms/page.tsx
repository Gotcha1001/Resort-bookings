// app/(public)/rooms/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicRoomCard } from "@/app/components/PublicRoomCard";

export default function PublicRoomsPage() {
  // Public list – never include archived rooms
  const rooms = useQuery(api.rooms.list, { includeArchived: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Rooms & cottages
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
          Browse available rooms and cottages. Select one to see dates and book
          your stay.
        </p>
      </div>

      {/* Loading */}
      {rooms === undefined && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {rooms !== undefined && rooms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-700">
          <p className="text-lg text-stone-600 dark:text-stone-300">
            No rooms or cottages available yet.
          </p>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Check back soon — new stays are added regularly.
          </p>
        </div>
      )}

      {/* Grid of PublicRoomCard */}
      {rooms !== undefined && rooms.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <PublicRoomCard key={room._id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
