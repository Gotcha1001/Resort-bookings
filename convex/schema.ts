// convex/schema.ts
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
  // sidebar/navbar and PayFast display fields, the public contact details,
  // and the editable copy shown on the About page. Read by everyone,
  // written only by admins.
  resortSettings: defineTable({
    name: v.string(),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoPublicId: v.optional(v.string()),
    // Contact details -- shown on Activities / Amenities / About pages.
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    // Editable About-page copy. aboutStory paragraphs are separated by a
    // blank line. Value cards ("what we care about") live in aboutValues.
    aboutHeading: v.optional(v.string()),
    aboutStory: v.optional(v.string()),
    aboutLocationText: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  // Cards shown on the public Activities page. Admin-managed, orderable,
  // each with an optional photo (used for the grid and the hero carousel).
  activities: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    order: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_isArchived_order", ["isArchived", "order"]),

  // Cards shown on the public Amenities page. Same shape as activities.
  amenities: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    order: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_isArchived_order", ["isArchived", "order"]),

  // "What we care about" cards on the About page. Same shape again.
  aboutValues: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    order: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_isArchived_order", ["isArchived", "order"]),

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
