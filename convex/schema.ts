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

  // A bookable room / venue / place to stay (e.g. "Ocean View Suite").
  venues: defineTable({
    name: v.string(),
    description: v.string(),
    facilities: v.array(v.string()),
    pricePerDay: v.number(),
    imagePublicId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_isArchived", ["isArchived"]),

  // A single booking against a venue for a weekly or monthly period.
  bookings: defineTable({
    venueId: v.id("venues"),
    customerName: v.string(),
    contactNumber: v.string(),
    email: v.optional(v.string()),
    numberOfDays: v.number(), // must replace bookingType here
    startDate: v.number(),
    endDate: v.number(),
    amount: v.number(),
    isPaid: v.boolean(),
    paidAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),
    cancelledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_venue", ["venueId"])
    .index("by_status", ["status"])
    .index("by_venue_status", ["venueId", "status"])
    .index("by_startDate", ["startDate"]),
});
