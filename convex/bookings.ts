import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  calculateAmount,
  calculateEndDate,
  rangesOverlap,
} from "../lib/pricing";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized -- no identity found");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) {
    throw new Error("User record not found -- sign in again");
  }
  return user;
}

// NOTE: assumes users have a `role` field ("admin" | "customer").
// If you already export requireAdmin from another file, delete this and import it.
async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Forbidden -- admin access required");
  }
  return user;
}

function monthRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  return { start, end };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// ADMIN: full booking list for one room (contains guest details).
export const listByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    await requireAdmin(ctx);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    return bookings.sort((a, b) => b.startDate - a.startDate);
  },
});

// PUBLIC: only the date ranges that are taken, no guest details.
// Powers the read-only availability calendar on the customer room page.
export const getBookedRanges = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    return bookings
      .filter((b) => b.status === "active" || b.status === "pending_payment")
      .map((b) => ({ startDate: b.startDate, endDate: b.endDate }));
  },
});

// ADMIN
export const listActiveByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("bookings")
      .withIndex("by_room_status", (q) =>
        q.eq("roomId", roomId).eq("status", "active"),
      )
      .collect();
  },
});

// ADMIN
export const listCurrentMonth = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const { start, end } = monthRange();
    const bookings = await ctx.db.query("bookings").collect();
    const inMonth = bookings.filter((booking) =>
      rangesOverlap(booking.startDate, booking.endDate, start, end),
    );
    return inMonth.sort((a, b) => b.startDate - a.startDate);
  },
});

// ADMIN
export const financialSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const { start, end } = monthRange();
    const bookings = await ctx.db.query("bookings").collect();
    const currentMonthBookings = bookings.filter(
      (booking) =>
        booking.status !== "cancelled" &&
        booking.status !== "pending_payment" &&
        rangesOverlap(booking.startDate, booking.endDate, start, end),
    );

    const totalIncome = currentMonthBookings.reduce(
      (sum, b) => sum + b.amount,
      0,
    );
    const paidIncome = currentMonthBookings
      .filter((b) => b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      totalIncome,
      paidIncome,
      outstandingIncome: totalIncome - paidIncome,
      bookingCount: currentMonthBookings.length,
    };
  },
});

// PUBLIC: success/cancel pages poll this. Booking IDs are unguessable.
export const getForPayment = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => await ctx.db.get(bookingId),
});

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------

// Walk-in / manual booking made by an admin. Stay runs [startDate, endDate),
// where endDate is check-out.
export const createManual = mutation({
  args: {
    roomId: v.id("rooms"),
    guestName: v.string(),
    guestPhone: v.string(),
    guestEmail: v.optional(v.string()),
    numberOfNights: v.number(),
    startDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (!Number.isInteger(args.numberOfNights) || args.numberOfNights < 1) {
      throw new Error("A stay must be at least 1 night");
    }
    if (!Number.isFinite(args.startDate)) {
      throw new Error("Invalid check-in date");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.isArchived) {
      throw new Error("This room is no longer available for booking");
    }

    const endDate = calculateEndDate(args.startDate, args.numberOfNights);

    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const hasClash = existing.some(
      (b) =>
        (b.status === "active" || b.status === "pending_payment") &&
        rangesOverlap(args.startDate, endDate, b.startDate, b.endDate),
    );
    if (hasClash) {
      throw new Error("This room is already booked for part of that period");
    }

    const amount = calculateAmount(args.numberOfNights, room.pricePerNight);

    return await ctx.db.insert("bookings", {
      roomId: args.roomId,
      guestName: args.guestName.trim(),
      guestPhone: args.guestPhone.trim(),
      guestEmail: args.guestEmail?.trim() || undefined,
      numberOfNights: args.numberOfNights,
      startDate: args.startDate,
      endDate,
      amount,
      isPaid: false,
      status: "active",
      notes: args.notes?.trim() || undefined,
      createdAt: Date.now(),
      createdBy: admin._id,
    });
  },
});

export const markAsPaid = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await requireAdmin(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    await ctx.db.patch(bookingId, { isPaid: true, paidAt: Date.now() });
  },
});

export const markAsUnpaid = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await requireAdmin(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    await ctx.db.patch(bookingId, { isPaid: false, paidAt: undefined });
  },
});

export const cancel = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await requireAdmin(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") return;
    await ctx.db.patch(bookingId, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await requireAdmin(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "cancelled") {
      throw new Error("Only cancelled bookings can be deleted");
    }
    await ctx.db.delete(bookingId);
  },
});

// ---------------------------------------------------------------------------
// Public (customer) mutation -- intentionally NO auth
// ---------------------------------------------------------------------------

export const createPending = mutation({
  args: {
    roomId: v.id("rooms"),
    guestName: v.string(),
    guestPhone: v.string(),
    guestEmail: v.optional(v.string()),
    numberOfNights: v.number(),
    startDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.numberOfNights) || args.numberOfNights < 1) {
      throw new Error("A stay must be at least 1 night");
    }
    if (!Number.isFinite(args.startDate)) {
      throw new Error("Invalid check-in date");
    }
    if (!args.guestName.trim() || !args.guestPhone.trim()) {
      throw new Error("Name and phone number are required");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room || room.isArchived) throw new Error("Room not available");

    const endDate = calculateEndDate(args.startDate, args.numberOfNights);
    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const hasClash = existing.some(
      (b) =>
        (b.status === "active" || b.status === "pending_payment") &&
        rangesOverlap(args.startDate, endDate, b.startDate, b.endDate),
    );
    if (hasClash) {
      throw new Error("Those dates were just taken — pick different ones");
    }

    const amount = calculateAmount(args.numberOfNights, room.pricePerNight);
    return await ctx.db.insert("bookings", {
      roomId: args.roomId,
      guestName: args.guestName.trim(),
      guestPhone: args.guestPhone.trim(),
      guestEmail: args.guestEmail?.trim() || undefined,
      numberOfNights: args.numberOfNights,
      startDate: args.startDate,
      endDate,
      amount,
      isPaid: false,
      status: "pending_payment",
      notes: args.notes?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// PayFast (INTERNAL -- only called from the ITN webhook route, never the client)
// ---------------------------------------------------------------------------

// ConvexHttpClient (used by the Next.js ITN route) can only call PUBLIC
// functions, so this is a normal mutation guarded by a shared server secret.
// Set the same value in Convex (`npx convex env set PAYFAST_WEBHOOK_SECRET ...`)
// and in the Next.js .env. Never expose the secret to the browser.
// ---------------------------------------------------------------------------
// convex/bookings.ts  --  REPLACE the two `internalMutation` versions of
// markPaidFromWebhook and logFailedPayment with everything below, then add
// the import changes noted here.
//
// Why: app/api/payfast/notify/route.ts calls these through `api.bookings.*`
// with a `secret`. An internalMutation is not on `api`, so the current
// version can never be reached and paid bookings would stay unpaid.
//
// Imports at the top of bookings.ts should include:
//   import { internalMutation, mutation, query } from "./_generated/server";
//   (rangesOverlap is already imported from ../lib/pricing)
//
// Convex dashboard -> Settings -> Environment Variables:
//   PAYFAST_WEBHOOK_SECRET = <long random string>
// and the SAME value in your Next.js env (.env.local / Vercel).
// ---------------------------------------------------------------------------

function assertWebhookSecret(secret: string): void {
  const expected = process.env.PAYFAST_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Forbidden");
  }
}

// Called only by the ITN route, after signature + PayFast server validation
// + amount check have all passed.
export const markPaidFromWebhook = mutation({
  args: {
    secret: v.string(),
    bookingId: v.id("bookings"),
    payfastPaymentId: v.string(),
  },
  handler: async (ctx, { secret, bookingId, payfastPaymentId }) => {
    assertWebhookSecret(secret);

    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.isPaid) return; // ITN can fire more than once

    // Money arrived for a booking we can't simply activate: log it so the
    // admin can refund or resolve it by hand.
    if (booking.status === "cancelled") {
      await ctx.db.insert("failedPayments", {
        paymentId: payfastPaymentId,
        bookingId,
        status: "PAID_AFTER_CANCEL",
        amount: booking.amount,
        reason: "Payment received for a cancelled booking. Refund needed.",
        timestamp: Date.now(),
        resolved: false,
      });
      return;
    }

    // The 30-minute checkout hold lapsed but the guest paid anyway. Reinstate
    // only if nobody else took the dates in the meantime.
    if (booking.status === "expired") {
      const sameRoom = await ctx.db
        .query("bookings")
        .withIndex("by_room", (q) => q.eq("roomId", booking.roomId))
        .collect();
      const taken = sameRoom.some(
        (b) =>
          b._id !== booking._id &&
          (b.status === "active" || b.status === "pending_payment") &&
          rangesOverlap(
            booking.startDate,
            booking.endDate,
            b.startDate,
            b.endDate,
          ),
      );
      if (taken) {
        await ctx.db.insert("failedPayments", {
          paymentId: payfastPaymentId,
          bookingId,
          status: "PAID_AFTER_EXPIRY",
          amount: booking.amount,
          reason:
            "Paid after the hold expired and the dates were re-booked. Refund needed.",
          timestamp: Date.now(),
          resolved: false,
        });
        return;
      }
    }

    await ctx.db.patch(bookingId, {
      isPaid: true,
      paidAt: Date.now(),
      status: "active",
      payfastPaymentId,
    });
  },
});

// Same shape as the tutoring app's version, with bookingId instead of studentId.
export const logFailedPayment = mutation({
  args: {
    secret: v.string(),
    paymentId: v.string(),
    bookingId: v.optional(v.id("bookings")),
    status: v.string(),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { secret, ...entry }) => {
    assertWebhookSecret(secret);
    await ctx.db.insert("failedPayments", {
      ...entry,
      timestamp: Date.now(),
      resolved: false,
    });
  },
});

// ---------------------------------------------------------------------------
// NEW: release dates when a guest abandons checkout.
// Without this, a "pending_payment" booking blocks the room forever.
// ---------------------------------------------------------------------------
const CHECKOUT_HOLD_MS = 30 * 60 * 1000;

export const expireStalePending = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - CHECKOUT_HOLD_MS;
    const pending = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending_payment"))
      .collect();
    const stale = pending.filter((b) => b.createdAt < cutoff);
    for (const booking of stale) {
      await ctx.db.patch(booking._id, { status: "expired" });
    }
    return stale.length;
  },
});

// ---------------------------------------------------------------------------
// convex/crons.ts -- add this next to the existing "expire past bookings":
//
// crons.interval(
//   "expire abandoned checkouts",
//   { minutes: 10 },
//   internal.bookings.expireStalePending,
// );
// ---------------------------------------------------------------------------
// Flips paid bookings whose check-out has passed from "active" to "expired".
// Referenced by convex/crons.ts ("expire past bookings").
export const expirePastBookings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const toExpire = activeBookings.filter((booking) => booking.endDate <= now);
    for (const booking of toExpire) {
      await ctx.db.patch(booking._id, { status: "expired" });
    }
    return toExpire.length;
  },
});
