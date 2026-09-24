// app/(public)/rooms/[roomId]/page.tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ImageOff, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { usePublicDateSelection } from "@/hooks/usePublicDateSelection";
import { formatCurrency } from "@/lib/format";
import { payWithPayfast } from "@/lib/payWithPayfast";
import { PublicAvailabilityCalendar } from "@/app/components/calendar/PublicAvailabilityCalendar";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function PublicRoomDetailPage({ params }: PageProps) {
  const { roomId } = use(params);
  const typedRoomId = roomId as Id<"rooms">;

  const room = useQuery(api.rooms.get, { roomId: typedRoomId });
  const bookedRanges = useQuery(api.bookings.getBookedRanges, {
    roomId: typedRoomId,
  });

  const createPending = useMutation(api.bookings.createPending);

  const { selection, range, bookedDays, selectDay, clearSelection } =
    usePublicDateSelection(bookedRanges);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────
  if (room === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-stone-500">
        Loading room…
      </div>
    );
  }

  // ── Not found / archived ─────────────────────────────────────────────
  if (room === null || room.isArchived) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Room not available
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          This room or cottage is no longer listed.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/rooms">← Back to all rooms</Link>
        </Button>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────
  function handleDayClick(day: Date) {
    const outcome = selectDay(day);
    if (outcome === "blocked") {
      toast.error("Those dates overlap an existing booking.");
    } else if (outcome === "past") {
      toast.error("You can’t book a date in the past.");
    }
  }

  function handleContinueFromCalendar() {
    if (!range) return;
    setShowForm(true);
  }

  async function handleBookAndPay() {
    if (!range || !room) return;

    if (!guestName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!guestPhone.trim()) {
      toast.error("Please enter a phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = await createPending({
        roomId: typedRoomId,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        numberOfNights: range.numberOfDays,
        startDate: range.startDate,
        notes: notes.trim() || undefined,
      });

      // Hand off to PayFast (form POST – page will navigate away)
      await payWithPayfast(bookingId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
      setIsSubmitting(false);
    }
  }

  const totalAmount =
    range !== null ? range.numberOfDays * room.pricePerNight : 0;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/rooms"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-teal-600 dark:text-stone-400 dark:hover:text-teal-400"
      >
        <ArrowLeft size={16} />
        All rooms & cottages
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ── Left: room info ─────────────────────────────────────────── */}
        <div>
          {/* Image */}
          {room.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.imageUrl}
              alt={room.name}
              className="h-64 w-full rounded-2xl object-cover sm:h-80"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600 sm:h-80">
              <ImageOff size={40} />
            </div>
          )}

          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">
                {room.name}
              </h1>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                {room.roomType}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Users size={15} />
                Sleeps up to {room.maxGuests}
              </span>
              <span className="font-semibold text-stone-900 dark:text-stone-50">
                {formatCurrency(room.pricePerNight)}
                <span className="font-normal text-stone-400"> / night</span>
              </span>
            </div>

            <p className="mt-4 whitespace-pre-line text-stone-600 dark:text-stone-300">
              {room.description || "No description yet."}
            </p>

            {room.amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Amenities
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: calendar + booking form ──────────────────────────── */}
        <div className="space-y-6">
          <PublicAvailabilityCalendar
            bookedDays={bookedDays}
            selection={selection}
            range={range}
            onDayClick={handleDayClick}
            onClearSelection={() => {
              clearSelection();
              setShowForm(false);
            }}
            onContinue={handleContinueFromCalendar}
            pricePerNight={room.pricePerNight}
            continueLabel="Continue to details"
          />

          {/* Guest details form – shown after dates are chosen */}
          {showForm && range && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">
                Your details
              </h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {range.numberOfDays} night{range.numberOfDays === 1 ? "" : "s"}{" "}
                · {formatCurrency(totalAmount)}
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="guestName">Full name *</Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Jane Smith"
                    className="mt-1"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="guestPhone">Phone number *</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="082 123 4567"
                    className="mt-1"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <Label htmlFor="guestEmail">Email (optional)</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="mt-1"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Arrival time, special requests…"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                className="mt-6 w-full bg-teal-600 py-6 text-base text-white hover:bg-teal-500"
                disabled={isSubmitting}
                onClick={handleBookAndPay}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to PayFast…
                  </>
                ) : (
                  `Pay ${formatCurrency(totalAmount)} with PayFast`
                )}
              </Button>

              <p className="mt-3 text-center text-xs text-stone-400">
                You’ll be redirected to PayFast to complete payment securely.
                Your dates are held for 30 minutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
