// app/(public)/booking/[bookingId]/cancel/page.tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { payWithPayfast } from "@/lib/payWithPayfast";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function BookingCancelPage({ params }: PageProps) {
  const { bookingId } = use(params);
  const typedId = bookingId as Id<"bookings">;

  const booking = useQuery(api.bookings.getForPayment, {
    bookingId: typedId,
  });

  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await payWithPayfast(typedId);
      // Page navigates away to PayFast
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not restart payment.";
      toast.error(message);
      setIsRetrying(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (booking === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────
  if (booking === null) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Booking not found
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          We couldn&apos;t find this booking.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/rooms">Back to rooms</Link>
        </Button>
      </div>
    );
  }

  // ── Already paid (edge case: user hit cancel after paying) ───────────
  if (booking.isPaid) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          This booking is already paid
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          No further action needed.
        </p>
        <Button
          asChild
          className="mt-6 bg-teal-600 text-white hover:bg-teal-500"
        >
          <Link href={`/booking/${bookingId}/success`}>View confirmation</Link>
        </Button>
      </div>
    );
  }

  // ── Cancelled / abandoned checkout ───────────────────────────────────
  const canRetry =
    booking.status === "pending_payment" || booking.status === "expired";

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <XCircle className="mx-auto h-16 w-16 text-stone-400 dark:text-stone-500" />

      <h1 className="mt-6 text-3xl font-bold text-stone-900 dark:text-stone-50">
        Payment cancelled
      </h1>
      <p className="mt-3 text-stone-600 dark:text-stone-300">
        No charge was made. Your dates are still held for a short time if
        you&apos;d like to try again.
      </p>

      {/* Booking summary */}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 text-left text-sm dark:border-stone-800 dark:bg-stone-900">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Guest</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-50">
              {booking.guestName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Check-in</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-50">
              {formatDate(booking.startDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Nights</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-50">
              {booking.numberOfNights}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-stone-100 pt-2 dark:border-stone-800">
            <dt className="text-stone-500">Amount</dt>
            <dd className="font-semibold text-stone-900 dark:text-stone-50">
              {formatCurrency(booking.amount)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {canRetry && (
          <Button
            className="bg-teal-600 text-white hover:bg-teal-500"
            disabled={isRetrying}
            onClick={handleRetry}
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              "Try payment again"
            )}
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/rooms">Browse rooms</Link>
        </Button>
      </div>

      {!canRetry && (
        <p className="mt-4 text-xs text-stone-400">
          This booking can no longer be paid online. Please choose new dates
          from the rooms page.
        </p>
      )}
    </div>
  );
}
