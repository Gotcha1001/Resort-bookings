import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  generateSignature,
  getPayFastCredentials,
  getPayFastUrl,
} from "@/lib/payfastUtils";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { bookingId } = (await req.json()) as { bookingId: string };

  const booking = await convex.query(api.bookings.getForPayment, {
    bookingId: bookingId as Id<"bookings">,
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.isPaid) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const credentials = getPayFastCredentials();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // One booking → one payment. bookingId doubles as m_payment_id, so the
  // ITN handler can look the booking straight up with no parsing games.
  const fields: Record<string, string | number> = {
    merchant_id: credentials.merchantId,
    merchant_key: credentials.merchantKey,
    return_url: `${siteUrl}/booking/${booking._id}/success`,
    cancel_url: `${siteUrl}/booking/${booking._id}/cancel`,
    notify_url: `${siteUrl}/api/payfast/notify`,
    name_first: booking.guestName.split(" ")[0] ?? booking.guestName,
    name_last:
      booking.guestName.split(" ").slice(1).join(" ") || booking.guestName,
    email_address: booking.guestEmail ?? "",
    m_payment_id: booking._id,
    amount: booking.amount.toFixed(2),
    item_name: `Booking #${booking._id.slice(-6)}`,
    item_description: `${booking.numberOfNights} night(s)`,
  };

  const signature = generateSignature(fields, credentials.passphrase);

  return NextResponse.json({
    actionUrl: getPayFastUrl(),
    fields: { ...fields, signature },
  });
}
