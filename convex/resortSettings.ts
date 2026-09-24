// convex/resortSettings.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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

// Trim, and treat an empty string as "clear this field".
function clean(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function assertMaxLength(label: string, value: string, max: number): void {
  if (value.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer`);
  }
}

// Public: the navbar, sidebar and every public page read this.
export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("resortSettings").first();
  },
});

// Partial update. For every argument:
//   - omitted            -> field left as it is
//   - a string           -> saved (an empty string clears the field)
//   - null (logo only)   -> logo removed
// This lets the "General" and "About" tabs each save only their own fields.
export const update = mutation({
  args: {
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.union(v.string(), v.null())),
    logoPublicId: v.optional(v.union(v.string(), v.null())),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    aboutHeading: v.optional(v.string()),
    aboutStory: v.optional(v.string()),
    aboutLocationText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query("resortSettings").first();

    if (args.name !== undefined) {
      if (args.name.trim() === "") throw new Error("Resort name is required");
      assertMaxLength("Resort name", args.name, 80);
    }
    if (args.tagline !== undefined)
      assertMaxLength("Tagline", args.tagline, 200);
    if (args.phone !== undefined) assertMaxLength("Phone", args.phone, 40);
    if (args.email !== undefined) assertMaxLength("Email", args.email, 120);
    if (args.address !== undefined)
      assertMaxLength("Address", args.address, 300);
    if (args.aboutHeading !== undefined) {
      assertMaxLength("About heading", args.aboutHeading, 120);
    }
    if (args.aboutStory !== undefined) {
      assertMaxLength("About story", args.aboutStory, 10000);
    }
    if (args.aboutLocationText !== undefined) {
      assertMaxLength("Location text", args.aboutLocationText, 1000);
    }

    const patch: Partial<Omit<Doc<"resortSettings">, "_id" | "_creationTime">> =
      {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.tagline !== undefined) patch.tagline = clean(args.tagline);
    if (args.phone !== undefined) patch.phone = clean(args.phone);
    if (args.email !== undefined) patch.email = clean(args.email);
    if (args.address !== undefined) patch.address = clean(args.address);
    if (args.aboutHeading !== undefined) {
      patch.aboutHeading = clean(args.aboutHeading);
    }
    if (args.aboutStory !== undefined)
      patch.aboutStory = clean(args.aboutStory);
    if (args.aboutLocationText !== undefined) {
      patch.aboutLocationText = clean(args.aboutLocationText);
    }
    if (args.logoUrl !== undefined) patch.logoUrl = args.logoUrl ?? undefined;
    if (args.logoPublicId !== undefined) {
      patch.logoPublicId = args.logoPublicId ?? undefined;
    }

    // Logo replaced or removed -> delete the old file from Cloudinary.
    const oldLogoId = existing?.logoPublicId;
    if (
      oldLogoId &&
      args.logoPublicId !== undefined &&
      args.logoPublicId !== oldLogoId
    ) {
      await ctx.scheduler.runAfter(0, internal.cloudinary.deleteImage, {
        publicId: oldLogoId,
      });
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...patch,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
      return existing._id;
    }

    if (!patch.name) throw new Error("Resort name is required");
    return await ctx.db.insert("resortSettings", {
      ...patch,
      name: patch.name,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    });
  },
});
