// convex/resortSettings.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

async function requireAdmin(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!user || user.role !== "admin") throw new Error("Admin access required");
  return user;
}

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("resortSettings").first();
  },
});

export const update = mutation({
  args: {
    name: v.string(),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query("resortSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
      return existing._id;
    }
    return await ctx.db.insert("resortSettings", {
      ...args,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    });
  },
});
