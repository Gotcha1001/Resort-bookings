// components/PublicRoomCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Users } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/format";

interface PublicRoomCardProps {
  room: Doc<"rooms">;
  // Pass true for the cards visible without scrolling (the first 2-3 on
  // mobile, since cards stack in a single column there). That tells
  // next/image to preload the image with fetchpriority="high" instead of
  // lazy-loading it, which is what actually fixes "images load slowly on
  // mobile" — lazy-loading is correct for every card below the fold.
  priority?: boolean;
}

export function PublicRoomCard({
  room,
  priority = false,
}: PublicRoomCardProps) {
  return (
    <Link
      href={`/rooms/${room._id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-accent hover:shadow-md dark:bg-surface"
    >
      {room.imageUrl ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={room.imageUrl}
            alt={room.name}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            // One column on mobile, two on small tablets, a third on desktop
            // — matches the grid in the pages that render this card.
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted/30 text-muted-foreground">
          <ImageOff size={32} />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              {room.name}
            </h3>
            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              {room.roomType}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {room.description || "No description yet."}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users size={13} />
            Sleeps up to {room.maxGuests}
          </div>
          {room.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{room.amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline gap-1 border-t border-border pt-3 text-sm">
          <span className="font-semibold text-foreground">
            {formatCurrency(room.pricePerNight)}
          </span>
          <span className="font-normal text-muted-foreground">/ night</span>
        </div>
      </div>
    </Link>
  );
}
