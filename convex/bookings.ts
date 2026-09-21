import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  calculateAmount,
  calculateEndDate,
  rangesOverlap,
} from "../lib/pricing";

async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
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

function monthRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  return { start, end };
}

export const listByVenue = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, { venueId }) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_venue", (q) => q.eq("venueId", venueId))
      .collect();
    return bookings.sort((a, b) => b.startDate - a.startDate);
  },
});

export const listActiveByVenue = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, { venueId }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_venue_status", (q) =>
        q.eq("venueId", venueId).eq("status", "active"),
      )
      .collect();
  },
});

export const listCurrentMonth = query({
  args: {},
  handler: async (ctx) => {
    const { start, end } = monthRange();
    const bookings = await ctx.db.query("bookings").collect();
    const inMonth = bookings.filter((booking) =>
      rangesOverlap(booking.startDate, booking.endDate, start, end),
    );
    return inMonth.sort((a, b) => b.startDate - a.startDate);
  },
});

export const financialSummary = query({
  args: {},
  handler: async (ctx) => {
    const { start, end } = monthRange();
    const bookings = await ctx.db.query("bookings").collect();
    const currentMonthBookings = bookings.filter(
      (booking) =>
        booking.status !== "cancelled" &&
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

// Takes a check-in day (local midnight from the browser) and a number of
// nights. The stay runs [startDate, endDate), where endDate is check-out.
export const create = mutation({
  args: {
    venueId: v.id("venues"),
    customerName: v.string(),
    contactNumber: v.string(),
    email: v.optional(v.string()),
    numberOfDays: v.number(),
    startDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!Number.isInteger(args.numberOfDays) || args.numberOfDays < 1) {
      throw new Error("A stay must be at least 1 night");
    }
    if (!Number.isFinite(args.startDate)) {
      throw new Error("Invalid check-in date");
    }

    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }
    if (venue.isArchived) {
      throw new Error("This venue is no longer available for booking");
    }

    const endDate = calculateEndDate(args.startDate, args.numberOfDays);

    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_venue_status", (q) =>
        q.eq("venueId", args.venueId).eq("status", "active"),
      )
      .collect();

    const hasClash = activeBookings.some((booking) =>
      rangesOverlap(
        args.startDate,
        endDate,
        booking.startDate,
        booking.endDate,
      ),
    );
    if (hasClash) {
      throw new Error("This venue is already booked for part of that period");
    }

    const amount = calculateAmount(args.numberOfDays, venue.pricePerDay);

    return await ctx.db.insert("bookings", {
      venueId: args.venueId,
      customerName: args.customerName.trim(),
      contactNumber: args.contactNumber.trim(),
      email: args.email?.trim() || undefined,
      numberOfDays: args.numberOfDays,
      startDate: args.startDate,
      endDate,
      amount,
      isPaid: false,
      status: "active",
      notes: args.notes?.trim() || undefined,
      createdAt: Date.now(),
      createdBy: user._id,
    });
  },
});

export const markAsPaid = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    await ctx.db.patch(bookingId, { isPaid: true, paidAt: Date.now() });
  },
});

export const markAsUnpaid = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { isPaid: false, paidAt: undefined });
  },
});

export const cancel = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status === "cancelled") {
      return;
    }
    await ctx.db.patch(bookingId, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });
  },
});

// Runs on a schedule (see convex/crons.ts). Frees up any venue whose
// booking period has ended by flipping it from "active" to "expired".
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

export const remove = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status !== "cancelled") {
      throw new Error("Only cancelled bookings can be deleted");
    }
    await ctx.db.delete(bookingId);
  },
});
