import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Singleton-ish table: one row per resort. Holds the name shown in the
  // sidebar/navbar and PayFast display fields. Read by everyone, written
  // only by admins.
  resortSettings: defineTable({
    name: v.string(),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  rooms: defineTable({
    name: v.string(),
    roomType: v.union(v.literal("room"), v.literal("cottage")),
    description: v.string(),
    amenities: v.array(v.string()),
    maxGuests: v.number(),
    pricePerNight: v.number(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_isArchived", ["isArchived"]),

  bookings: defineTable({
    roomId: v.id("rooms"),
    guestName: v.string(),
    guestPhone: v.string(),
    guestEmail: v.optional(v.string()),
    numberOfNights: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    amount: v.number(),
    isPaid: v.boolean(),
    paidAt: v.optional(v.number()),
    payfastPaymentId: v.optional(v.string()), // m_payment_id we sent PayFast
    status: v.union(
      v.literal("pending_payment"), // customer started checkout, not paid
      v.literal("active"), // paid (or admin-created manually)
      v.literal("cancelled"),
      v.literal("expired"),
    ),
    cancelledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")), // undefined for a public/customer booking
  })
    .index("by_room", ["roomId"])
    .index("by_status", ["status"])
    .index("by_room_status", ["roomId", "status"])
    .index("by_payfastPaymentId", ["payfastPaymentId"]),

  failedPayments: defineTable({
    paymentId: v.string(),
    bookingId: v.optional(v.id("bookings")),
    status: v.string(),
    amount: v.number(),
    reason: v.string(),
    timestamp: v.number(),
    resolved: v.boolean(),
  }),
});
