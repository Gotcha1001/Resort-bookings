// convex/rooms.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

async function requireAdmin(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized -- no identity found");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) throw new Error("User record not found -- sign in again");
  if (user.role !== "admin") throw new Error("Only admins can manage rooms");
  return user;
}

// Public: anyone (signed in or not) can browse non-archived rooms.
export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, { includeArchived }) => {
    const rooms = await ctx.db.query("rooms").collect();
    const filtered = includeArchived
      ? rooms
      : rooms.filter((r) => !r.isArchived);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => await ctx.db.get(roomId),
});

export const create = mutation({
  args: {
    name: v.string(),
    roomType: v.union(v.literal("room"), v.literal("cottage")),
    description: v.string(),
    amenities: v.array(v.string()),
    maxGuests: v.number(),
    pricePerNight: v.number(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    return await ctx.db.insert("rooms", {
      ...args,
      name: args.name.trim(),
      description: args.description.trim(),
      amenities: args.amenities.map((a) => a.trim()).filter(Boolean),
      isArchived: false,
      createdAt: Date.now(),
      createdBy: admin._id,
    });
  },
});

export const update = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
    roomType: v.union(v.literal("room"), v.literal("cottage")),
    description: v.string(),
    amenities: v.array(v.string()),
    maxGuests: v.number(),
    pricePerNight: v.number(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, ...updates }) => {
    await requireAdmin(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    const oldPublicId = room.imagePublicId;
    if (oldPublicId && oldPublicId !== updates.imagePublicId) {
      await ctx.scheduler.runAfter(0, internal.cloudinary.deleteImage, {
        publicId: oldPublicId,
      });
    }
    await ctx.db.patch(roomId, {
      ...updates,
      name: updates.name.trim(),
      description: updates.description.trim(),
      amenities: updates.amenities.map((a) => a.trim()).filter(Boolean),
    });
  },
});

export const archive = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(roomId, { isArchived: true });
  },
});

export const unarchive = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(roomId, { isArchived: false });
  },
});
