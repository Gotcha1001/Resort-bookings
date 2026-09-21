import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/format";

interface VenueCardProps {
  venue: Doc<"venues">;
  activeBookingCount: number;
}

export function VenueCard({ venue, activeBookingCount }: VenueCardProps) {
  const isOccupied = activeBookingCount > 0;
  return (
    <Link
      href={`/venues/${venue._id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
    >
      {venue.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600">
          <ImageOff size={28} />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {venue.name}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOccupied
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
            >
              {isOccupied ? "Booked" : "Available"}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {venue.description || "No description yet."}
          </p>
          {venue.facilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {venue.facilities.slice(0, 4).map((facility) => (
                <span
                  key={facility}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                >
                  {facility}
                </span>
              ))}
              {venue.facilities.length > 4 && (
                <span className="text-xs text-stone-400">
                  +{venue.facilities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline gap-4 border-t border-stone-100 pt-3 text-sm dark:border-stone-800">
          <span className="font-medium text-stone-900 dark:text-stone-50">
            {formatCurrency(venue.pricePerDay)}
            <span className="ml-1 font-normal text-stone-400">/ night</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
