import type { Doc } from "@/convex/_generated/dataModel";

type BookingStatus = Doc<"bookings">["status"];

const STATUS_STYLES: Record<BookingStatus, string> = {
  active: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  expired: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PaidBadge({ isPaid }: { isPaid: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPaid
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      }`}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}
