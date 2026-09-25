// components/venues/AdminBookingFormDialog.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDateInput, startOfDay, toDateInputValue } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  calculateAmount,
  calculateEndDate,
  rangesOverlap,
} from "@/lib/pricing";

function parseNights(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

interface SummaryRowProps {
  label: string;
  value: string;
  strong?: boolean;
}

function SummaryRow({ label, value, strong = false }: SummaryRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-foreground ${strong ? "font-semibold" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

interface BookingFormProps {
  room: Doc<"rooms">;
  bookings: ReadonlyArray<Doc<"bookings">>;
  initialStartDate: number | null;
  initialNumberOfNights: number;
  onSuccess: () => void;
}

// Lives inside DialogContent, which unmounts when the dialog closes, so this
// state resets (and re-reads the calendar selection) on every open.
function BookingForm({
  room,
  bookings,
  initialStartDate,
  initialNumberOfNights,
  onSuccess,
}: BookingFormProps) {
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [numberOfNightsInput, setNumberOfNightsInput] = useState<string>(
    String(initialNumberOfNights),
  );
  const [startDateInput, setStartDateInput] = useState<string>(
    toDateInputValue(initialStartDate ?? startOfDay(new Date())),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const createBooking = useMutation(api.bookings.createManual);

  // null means "not a valid value right now" (e.g. the field was cleared).
  const startDate = parseDateInput(startDateInput);
  const numberOfNights = parseNights(numberOfNightsInput);
  const endDate =
    startDate !== null && numberOfNights !== null
      ? calculateEndDate(startDate, numberOfNights)
      : null;
  const amount =
    numberOfNights !== null
      ? calculateAmount(numberOfNights, room.pricePerNight)
      : 0;
  const hasClash =
    startDate !== null &&
    endDate !== null &&
    bookings.some(
      (booking) =>
        (booking.status === "active" || booking.status === "pending_payment") &&
        rangesOverlap(startDate, endDate, booking.startDate, booking.endDate),
    );
  const canSubmit =
    startDate !== null && numberOfNights !== null && !hasClash && !isSubmitting;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (startDate === null || numberOfNights === null) {
      toast.error("Choose a valid check-in date and number of nights");
      return;
    }
    if (!guestName.trim()) {
      toast.error("Enter the guest's name");
      return;
    }
    if (!guestPhone.trim()) {
      toast.error("Enter a contact number");
      return;
    }
    if (hasClash) {
      toast.error("Those dates overlap an existing booking");
      return;
    }
    setIsSubmitting(true);
    try {
      await createBooking({
        roomId: room._id,
        guestName,
        guestPhone,
        guestEmail: guestEmail.trim() || undefined,
        numberOfNights,
        startDate,
      });
      toast.success(`Booking confirmed for ${guestName.trim()}`);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create booking",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guest-name">Guest name</Label>
        <Input
          id="guest-name"
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guest-phone">Contact number</Label>
          <Input
            id="guest-phone"
            type="tel"
            value={guestPhone}
            onChange={(event) => setGuestPhone(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest-email">Email (optional)</Label>
          <Input
            id="guest-email"
            type="email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Check-in date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDateInput}
            onChange={(event) => setStartDateInput(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number-of-nights">Number of nights</Label>
          <Input
            id="number-of-nights"
            type="number"
            min={1}
            step={1}
            value={numberOfNightsInput}
            onChange={(event) => setNumberOfNightsInput(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-3 text-sm dark:bg-muted/10">
        <SummaryRow
          label="Check-in"
          value={startDate !== null ? formatDate(startDate) : "—"}
        />
        <SummaryRow
          label="Check-out"
          value={endDate !== null ? formatDate(endDate) : "—"}
        />
        <SummaryRow
          label="Nights"
          value={numberOfNights !== null ? String(numberOfNights) : "—"}
        />
        <SummaryRow
          label="Amount due"
          value={numberOfNights !== null ? formatCurrency(amount) : "—"}
          strong
        />
      </div>
      {hasClash && (
        <p className="text-sm text-destructive">
          These dates overlap an existing booking. Pick different dates on the
          calendar.
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Booking..." : "Confirm booking"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface AdminBookingFormDialogProps {
  room: Doc<"rooms">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Check-in day picked on the calendar (local midnight), if any. */
  initialStartDate: number | null;
  initialNumberOfNights: number;
  /** Existing bookings for this room, used to warn about clashes. */
  bookings: ReadonlyArray<Doc<"bookings">>;
  /** Called after a booking is saved, so the caller can clear the selection. */
  onBooked: () => void;
}

export function AdminBookingFormDialog({
  room,
  open,
  onOpenChange,
  initialStartDate,
  initialNumberOfNights,
  bookings,
  onBooked,
}: AdminBookingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {room.name}</DialogTitle>
        </DialogHeader>
        <BookingForm
          room={room}
          bookings={bookings}
          initialStartDate={initialStartDate}
          initialNumberOfNights={initialNumberOfNights}
          onSuccess={() => {
            onOpenChange(false);
            onBooked();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
