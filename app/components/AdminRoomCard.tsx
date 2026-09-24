"use client";

import Link from "next/link";
import { ImageOff, Archive, ArchiveRestore } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { RoomFormDialog } from "./RoomFormDialog";

interface AdminRoomCardProps {
  room: Doc<"rooms">;
  activeBookingCount: number;
}

export function AdminRoomCard({
  room,
  activeBookingCount,
}: AdminRoomCardProps) {
  const isOccupied = activeBookingCount > 0;
  const archive = useMutation(api.rooms.archive);
  const unarchive = useMutation(api.rooms.unarchive);

  async function handleToggleArchive(): Promise<void> {
    try {
      if (room.isArchived) {
        await unarchive({ roomId: room._id });
        toast.success("Back on sale");
      } else {
        await archive({ roomId: room._id });
        toast.success("Hidden from the public site");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  }

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <Link href={`/admin/rooms/${room._id}`}>
        {room.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
          <img
            src={room.imageUrl}
            alt={room.name}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600">
            <ImageOff size={28} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <Link href={`/admin/rooms/${room._id}`}>
              <h3 className="text-lg font-semibold text-stone-900 hover:text-teal-600 dark:text-stone-50">
                {room.name}
              </h3>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                {room.roomType}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  room.isArchived
                    ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                    : isOccupied
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {room.isArchived
                  ? "Hidden"
                  : isOccupied
                    ? "Booked"
                    : "Available"}
              </span>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {room.description || "No description yet."}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm dark:border-stone-800">
          <span className="font-medium text-stone-900 dark:text-stone-50">
            {formatCurrency(room.pricePerNight)}
            <span className="ml-1 font-normal text-stone-400">/ night</span>
          </span>
          <div className="flex gap-1.5">
            <RoomFormDialog
              room={room}
              trigger={
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              }
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void handleToggleArchive()}
            >
              {room.isArchived ? (
                <ArchiveRestore size={14} />
              ) : (
                <Archive size={14} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
