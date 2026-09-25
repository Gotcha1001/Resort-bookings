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
import Image from "next/image";

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

  if (room === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading room…
      </div>
    );
  }

  if (room === null || room.isArchived) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Room not available
        </h1>
        <p className="mt-2 text-muted-foreground">
          This room or cottage is no longer listed.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/rooms">← Back to all rooms</Link>
        </Button>
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/rooms"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-accent"
      >
        <ArrowLeft size={16} />
        All rooms & cottages
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          {room.imageUrl ? (
            <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
              <Image
                src={room.imageUrl}
                alt={room.name}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground sm:h-80">
              <ImageOff size={40} />
            </div>
          )}

          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {room.name}
              </h1>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent">
                {room.roomType}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users size={15} />
                Sleeps up to {room.maxGuests}
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(room.pricePerNight)}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  / night
                </span>
              </span>
            </div>

            <p className="mt-4 whitespace-pre-line text-muted-foreground">
              {room.description || "No description yet."}
            </p>

            {room.amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Amenities
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-muted/30 px-3 py-1 text-sm text-foreground"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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

          {showForm && range && (
            <div className="rounded-2xl border border-border bg-white p-5 dark:bg-surface">
              <h3 className="text-base font-semibold text-foreground">
                Your details
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
                className="mt-6 w-full py-6 text-base"
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

              <p className="mt-3 text-center text-xs text-muted-foreground">
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
