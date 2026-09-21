import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

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

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, { includeArchived }) => {
    const venues = await ctx.db.query("venues").collect();
    const filtered = includeArchived
      ? venues
      : venues.filter((venue) => !venue.isArchived);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const get = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, { venueId }) => {
    return await ctx.db.get(venueId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    facilities: v.array(v.string()),
    pricePerDay: v.number(), //
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const venueId = await ctx.db.insert("venues", {
      name: args.name.trim(),
      description: args.description.trim(),
      facilities: args.facilities
        .map((facility) => facility.trim())
        .filter(Boolean),
      pricePerDay: args.pricePerDay,
      imageUrl: args.imageUrl,
      imagePublicId: args.imagePublicId,
      isArchived: false,
      createdAt: Date.now(),
      createdBy: user._id,
    });
    return venueId;
  },
});

export const update = mutation({
  args: {
    venueId: v.id("venues"),
    name: v.string(),
    description: v.string(),
    facilities: v.array(v.string()),
    pricePerDay: v.number(), //
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, { venueId, ...updates }) => {
    const venue = await ctx.db.get(venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // If this save swaps in a different photo (or removes it), the old
    // Cloudinary asset is now orphaned -- clean it up in the background.
    // Scheduled rather than awaited so a slow/failed Cloudinary call never
    // blocks or fails the actual venue save.
    const oldPublicId = venue.imagePublicId;
    const newPublicId = updates.imagePublicId;
    if (oldPublicId && oldPublicId !== newPublicId) {
      await ctx.scheduler.runAfter(0, internal.cloudinary.deleteImage, {
        publicId: oldPublicId,
      });
    }

    await ctx.db.patch(venueId, {
      name: updates.name.trim(),
      description: updates.description.trim(),
      facilities: updates.facilities
        .map((facility) => facility.trim())
        .filter(Boolean),
      pricePerDay: updates.pricePerDay,
      imageUrl: updates.imageUrl,
      imagePublicId: updates.imagePublicId,
    });
  },
});

export const archive = mutation({
  args: { venueId: v.id("venues") },
  handler: async (ctx, { venueId }) => {
    // Archiving is a soft delete -- the venue might be unarchived later,
    // so its photo is deliberately left in place here rather than deleted.
    await ctx.db.patch(venueId, { isArchived: true });
  },
});

export const unarchive = mutation({
  args: { venueId: v.id("venues") },
  handler: async (ctx, { venueId }) => {
    await ctx.db.patch(venueId, { isArchived: false });
  },
});

// Permanently deletes a venue and its Cloudinary photo, if it has one.
// Add a confirmation step in the UI before wiring this up -- unlike
// archive, this can't be undone.
export const remove = mutation({
  args: { venueId: v.id("venues") },
  handler: async (ctx, { venueId }) => {
    const venue = await ctx.db.get(venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }
    if (venue.imagePublicId) {
      await ctx.scheduler.runAfter(0, internal.cloudinary.deleteImage, {
        publicId: venue.imagePublicId,
      });
    }
    await ctx.db.delete(venueId);
  },
});
