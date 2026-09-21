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
      <span className="text-stone-500">{label}</span>
      <span
        className={`text-stone-900 dark:text-stone-100 ${
          strong ? "font-semibold" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface BookingFormProps {
  venue: Doc<"venues">;
  bookings: ReadonlyArray<Doc<"bookings">>;
  initialStartDate: number | null;
  initialNumberOfDays: number;
  onSuccess: () => void;
}

// Lives inside DialogContent, which unmounts when the dialog closes, so this
// state resets (and re-reads the calendar selection) on every open.
function BookingForm({
  venue,
  bookings,
  initialStartDate,
  initialNumberOfDays,
  onSuccess,
}: BookingFormProps) {
  const [customerName, setCustomerName] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [numberOfDaysInput, setNumberOfDaysInput] = useState<string>(
    String(initialNumberOfDays),
  );
  const [startDateInput, setStartDateInput] = useState<string>(
    toDateInputValue(initialStartDate ?? startOfDay(new Date())),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const createBooking = useMutation(api.bookings.create);

  // null means "not a valid value right now" (e.g. the field was cleared).
  const startDate = parseDateInput(startDateInput);
  const numberOfDays = parseNights(numberOfDaysInput);
  const endDate =
    startDate !== null && numberOfDays !== null
      ? calculateEndDate(startDate, numberOfDays)
      : null;
  const amount =
    numberOfDays !== null
      ? calculateAmount(numberOfDays, venue.pricePerDay)
      : 0;

  const hasClash =
    startDate !== null &&
    endDate !== null &&
    bookings.some(
      (booking) =>
        booking.status === "active" &&
        rangesOverlap(startDate, endDate, booking.startDate, booking.endDate),
    );

  const canSubmit =
    startDate !== null && numberOfDays !== null && !hasClash && !isSubmitting;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (startDate === null || numberOfDays === null) {
      toast.error("Choose a valid check-in date and number of nights");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Enter the customer's name");
      return;
    }
    if (!contactNumber.trim()) {
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
        venueId: venue._id,
        customerName,
        contactNumber,
        email: email.trim() || undefined,
        numberOfDays,
        startDate,
      });
      toast.success(`Booking confirmed for ${customerName.trim()}`);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create booking",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-name">Customer name</Label>
        <Input
          id="customer-name"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-number">Contact number</Label>
          <Input
            id="contact-number"
            type="tel"
            value={contactNumber}
            onChange={(event) => setContactNumber(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email (optional)</Label>
          <Input
            id="customer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
          <Label htmlFor="number-of-days">Number of nights</Label>
          <Input
            id="number-of-days"
            type="number"
            min={1}
            step={1}
            value={numberOfDaysInput}
            onChange={(event) => setNumberOfDaysInput(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-3 text-sm dark:bg-stone-900">
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
          value={numberOfDays !== null ? String(numberOfDays) : "—"}
        />
        <SummaryRow
          label="Amount due"
          value={numberOfDays !== null ? formatCurrency(amount) : "—"}
          strong
        />
      </div>

      {hasClash && (
        <p className="text-sm text-red-600 dark:text-red-400">
          These dates overlap an existing booking. Pick different dates on the
          calendar.
        </p>
      )}

      <DialogFooter>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Booking…" : "Confirm booking"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface BookingFormDialogProps {
  venue: Doc<"venues">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Check-in day picked on the calendar (local midnight), if any. */
  initialStartDate: number | null;
  initialNumberOfDays: number;
  /** Existing bookings for this venue, used to warn about clashes. */
  bookings: ReadonlyArray<Doc<"bookings">>;
  /** Called after a booking is saved, so the caller can clear the selection. */
  onBooked: () => void;
}

export function BookingFormDialog({
  venue,
  open,
  onOpenChange,
  initialStartDate,
  initialNumberOfDays,
  bookings,
  onBooked,
}: BookingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {venue.name}</DialogTitle>
        </DialogHeader>
        <BookingForm
          venue={venue}
          bookings={bookings}
          initialStartDate={initialStartDate}
          initialNumberOfDays={initialNumberOfDays}
          onSuccess={() => {
            onOpenChange(false);
            onBooked();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
