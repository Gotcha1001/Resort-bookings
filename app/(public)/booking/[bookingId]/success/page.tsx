"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { CheckCircle2, Loader2, Clock } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

import { formatCurrency, formatDate } from "@/lib/format";
import { DownloadInvoiceButton } from "@/app/components/bookings/DownloadInvoiceButton";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function BookingSuccessPage({ params }: PageProps) {
  const { bookingId } = use(params);
  const typedId = bookingId as Id<"bookings">;

  // Poll until ITN lands and isPaid flips (can take a few seconds)
  const booking = useQuery(api.bookings.getForPayment, {
    bookingId: typedId,
  });

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // After ~45s of waiting, stop showing the spinner forever
    const timer = setTimeout(() => setTimedOut(true), 45_000);
    return () => clearTimeout(timer);
  }, []);

  // ── Loading booking ──────────────────────────────────────────────────
  if (booking === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm text-stone-500">Loading your booking…</p>
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
          We couldn&apos;t find this booking. If you just paid, wait a moment
          and refresh.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/rooms">Back to rooms</Link>
        </Button>
      </div>
    );
  }

  const isPaid = booking.isPaid;
  const isPending = booking.status === "pending_payment" && !isPaid;

  // ── Still waiting for ITN ────────────────────────────────────────────
  if (isPending && !timedOut) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
        <h1 className="mt-6 text-2xl font-bold text-stone-900 dark:text-stone-50">
          Confirming your payment…
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          PayFast is notifying us. This usually takes a few seconds — hang
          tight.
        </p>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <Clock size={12} />
          Reference: {bookingId.slice(-8).toUpperCase()}
        </p>
      </div>
    );
  }

  // ── Timed out still unpaid ───────────────────────────────────────────
  if (isPending && timedOut) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Payment still confirming
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          We haven&apos;t received confirmation from PayFast yet. If money left
          your account, your booking will update automatically — you can also
          refresh this page in a minute.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/rooms">Back to rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Paid (or active) ─────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-teal-600 dark:text-teal-400" />
      <h1 className="mt-6 text-3xl font-bold text-stone-900 dark:text-stone-50">
        {isPaid ? "Payment successful" : "Booking confirmed"}
      </h1>
      <p className="mt-3 text-stone-600 dark:text-stone-300">
        Thank you, {booking.guestName}. Your stay is booked
        {isPaid ? " and paid" : ""}.
      </p>

      {/* Summary card */}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-left dark:border-stone-800 dark:bg-stone-900">
        <dl className="space-y-3 text-sm">
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
            <dt className="text-stone-500">Check-out</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-50">
              {formatDate(booking.endDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Nights</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-50">
              {booking.numberOfNights}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-stone-100 pt-3 dark:border-stone-800">
            <dt className="text-stone-500">Total</dt>
            <dd className="font-semibold text-stone-900 dark:text-stone-50">
              {formatCurrency(booking.amount)}
              {isPaid && (
                <span className="ml-2 text-xs font-normal text-teal-600 dark:text-teal-400">
                  Paid
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-xs text-stone-400">
        A confirmation may be sent to the phone number you provided.
        {isPaid
          ? " Download your invoice below for your records."
          : " Keep this page or screenshot for your records."}
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {isPaid && <DownloadInvoiceButton booking={booking} />}
        <Button asChild className="bg-teal-600 text-white hover:bg-teal-500">
          <Link href="/rooms">Browse more stays</Link>
        </Button>
      </div>
    </div>
  );
}
