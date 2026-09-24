// components/booking/DownloadInvoiceButton.tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Download, Loader2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/lib/invoicePdf";

interface DownloadInvoiceButtonProps {
  booking: Doc<"bookings">;
  className?: string;
}

// The booking only stores a roomId and the resort's name/contact details live
// in resortSettings, so this button loads both (both queries are public) and
// builds the PDF on click.
export function DownloadInvoiceButton({
  booking,
  className,
}: DownloadInvoiceButtonProps) {
  const room = useQuery(api.rooms.get, { roomId: booking.roomId });
  const settings = useQuery(api.resortSettings.get);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `undefined` = still loading. `null` (deleted room / no settings row yet)
  // is fine -- we fall back to generic wording below.
  const ready = room !== undefined && settings !== undefined;

  async function handleDownload() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await downloadInvoicePdf({
        invoiceNumber: `INV-${booking._id.slice(-8).toUpperCase()}`,
        issuedAt: booking.paidAt ?? booking.createdAt,
        paidAt: booking.paidAt,
        paymentReference: booking.payfastPaymentId,
        resort: {
          name: settings?.name ?? "Resort",
          tagline: settings?.tagline,
          phone: settings?.phone,
          email: settings?.email,
          address: settings?.address,
          logoUrl: settings?.logoUrl,
        },
        guest: {
          name: booking.guestName,
          phone: booking.guestPhone,
          email: booking.guestEmail,
        },
        stay: {
          roomName: room?.name ?? "Accommodation",
          roomType: room?.roomType ?? "room",
          startDate: booking.startDate,
          endDate: booking.endDate,
          nights: booking.numberOfNights,
          // Derived from what was actually charged, so a later price change
          // on the room can't make the invoice disagree with the amount paid.
          ratePerNight: booking.amount / booking.numberOfNights,
        },
        total: booking.amount,
        isPaid: booking.isPaid,
      });
    } catch (err) {
      console.error("Invoice PDF failed:", err);
      setError("We couldn't create your invoice. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        disabled={!ready || busy}
      >
        {busy || !ready ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {busy ? "Preparing invoice…" : "Download invoice (PDF)"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
