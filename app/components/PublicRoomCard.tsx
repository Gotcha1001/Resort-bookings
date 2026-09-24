import Link from "next/link";
import { ImageOff, Users } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/format";

interface PublicRoomCardProps {
  room: Doc<"rooms">;
}

export function PublicRoomCard({ room }: PublicRoomCardProps) {
  return (
    <Link
      href={`/rooms/${room._id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
    >
      {room.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
        <img
          src={room.imageUrl}
          alt={room.name}
          className="h-48 w-full object-cover transition group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600">
          <ImageOff size={32} />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {room.name}
            </h3>
            <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {room.roomType}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {room.description || "No description yet."}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Users size={13} />
            Sleeps up to {room.maxGuests}
          </div>
          {room.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                >
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="text-xs text-stone-400">
                  +{room.amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline gap-1 border-t border-stone-100 pt-3 text-sm dark:border-stone-800">
          <span className="font-semibold text-stone-900 dark:text-stone-50">
            {formatCurrency(room.pricePerNight)}
          </span>
          <span className="font-normal text-stone-400">/ night</span>
        </div>
      </div>
    </Link>
  );
}
