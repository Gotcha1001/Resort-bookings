import { NextRequest, NextResponse } from "next/server";
import { validateSignature, getPayFastCredentials } from "@/lib/payfastUtils";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const WEBHOOK_SECRET = process.env.PAYFAST_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of body.entries()) params[key] = value as string;

    const credentials = getPayFastCredentials();
    if (!validateSignature(params, credentials.passphrase)) {
      console.error("PayFast ITN: invalid signature");
      return NextResponse.json(
        { status: "INVALID_SIGNATURE" },
        { status: 400 },
      );
    }

    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const validIPs = [
      "197.97.145.144",
      "197.97.145.145",
      "197.97.145.146",
      "197.97.145.147",
      "197.97.145.148",
      "41.74.179.194",
      "41.74.179.195",
      "41.74.179.196",
      "41.74.179.197",
      "41.74.179.198",
    ];
    if (process.env.NODE_ENV === "production" && !validIPs.includes(clientIP)) {
      console.warn(`PayFast ITN: suspicious IP ${clientIP}`);
    }

    const payfastHost =
      process.env.NODE_ENV === "production"
        ? "www.payfast.co.za"
        : "sandbox.payfast.co.za";
    const confirmResponse = await fetch(
      `https://${payfastHost}/eng/query/validate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
      },
    );
    const confirmText = (await confirmResponse.text()).trim();
    if (confirmText !== "VALID") {
      console.error("PayFast ITN: server confirmation failed", confirmText);
      return NextResponse.json(
        { status: "INVALID_CONFIRMATION" },
        { status: 400 },
      );
    }

    const { payment_status, amount_gross, m_payment_id } = params;
    const bookingId = m_payment_id as Id<"bookings">;

    const booking = await convex.query(api.bookings.getForPayment, {
      bookingId,
    });
    if (!booking) {
      console.error("PayFast ITN: booking not found", bookingId);
      return NextResponse.json(
        { status: "INVALID_PAYMENT_ID" },
        { status: 400 },
      );
    }
    if (booking.isPaid) {
      // Duplicate ITN — PayFast resends these. Already handled, ack and stop.
      return NextResponse.json({ status: "OK" }, { status: 200 });
    }

    if (payment_status !== "COMPLETE") {
      await convex.mutation(api.bookings.logFailedPayment, {
        secret: WEBHOOK_SECRET,
        paymentId: m_payment_id,
        bookingId,
        status: payment_status,
        amount: parseFloat(amount_gross),
        reason: `Payment status: ${payment_status}`,
      });
      return NextResponse.json({ status: "OK" }, { status: 200 });
    }

    const receivedAmount = parseFloat(amount_gross);
    if (Math.abs(booking.amount - receivedAmount) > 0.01) {
      console.error(
        `PayFast ITN: amount mismatch. Expected ${booking.amount}, got ${receivedAmount}`,
      );
      await convex.mutation(api.bookings.logFailedPayment, {
        secret: WEBHOOK_SECRET,
        paymentId: m_payment_id,
        bookingId,
        status: "AMOUNT_MISMATCH",
        amount: receivedAmount,
        reason: `Expected ${booking.amount}, got ${receivedAmount}`,
      });
      return NextResponse.json({ status: "AMOUNT_MISMATCH" }, { status: 400 });
    }

    // This is the line that makes the admin side show "Paid" automatically.
    await convex.mutation(api.bookings.markPaidFromWebhook, {
      secret: WEBHOOK_SECRET,
      bookingId,
      payfastPaymentId: params.pf_payment_id ?? m_payment_id,
    });

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch (error) {
    console.error("PayFast ITN handler error:", error);
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}
