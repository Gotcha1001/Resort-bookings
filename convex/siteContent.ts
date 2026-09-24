// convex/siteContent.ts
//
// One set of functions for the three admin-managed card lists:
//   "activities"  -> /activities page
//   "amenities"   -> /amenities page
//   "aboutValues" -> "What we care about" cards on /about
// They share the same table shape, so every function takes a `section`.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { DEFAULT_CONTENT } from "../lib/siteContent";
import type { ContentSection } from "../lib/siteContent";

const sectionValidator = v.union(
  v.literal("activities"),
  v.literal("amenities"),
  v.literal("aboutValues"),
);

type ContentDoc = Doc<"activities"> | Doc<"amenities"> | Doc<"aboutValues">;

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  return user && user.role === "admin" ? user : null;
}

async function requireAdmin(ctx: MutationCtx): Promise<Doc<"users">> {
  const admin = await getAdmin(ctx);
  if (!admin) throw new Error("Admin access required");
  return admin;
}

function byOrder(a: ContentDoc, b: ContentDoc): number {
  return a.order - b.order || a._creationTime - b._creationTime;
}

async function loadSorted(
  ctx: QueryCtx | MutationCtx,
  section: ContentSection,
): Promise<ContentDoc[]> {
  const docs: ContentDoc[] = await ctx.db.query(section).collect();
  return docs.sort(byOrder);
}

function validateText(
  title: string,
  description: string,
): {
  title: string;
  description: string;
} {
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();
  if (!cleanTitle) throw new Error("A title is required");
  if (cleanTitle.length > MAX_TITLE) {
    throw new Error(`Title must be ${MAX_TITLE} characters or fewer`);
  }
  if (cleanDescription.length > MAX_DESCRIPTION) {
    throw new Error(
      `Description must be ${MAX_DESCRIPTION} characters or fewer`,
    );
  }
  return { title: cleanTitle, description: cleanDescription };
}

async function getItem(
  ctx: MutationCtx,
  section: ContentSection,
  rawId: string,
): Promise<ContentDoc> {
  const id = ctx.db.normalizeId(section, rawId);
  if (!id) throw new Error("Item not found");
  const doc = await ctx.db.get(id);
  if (!doc) throw new Error("Item not found");
  return doc;
}

async function deleteCloudinaryImage(
  ctx: MutationCtx,
  publicId: string | undefined,
): Promise<void> {
  if (!publicId) return;
  await ctx.scheduler.runAfter(0, internal.cloudinary.deleteImage, {
    publicId,
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// PUBLIC: what customers see (hidden items excluded), in the admin's order.
export const listPublic = query({
  args: { section: sectionValidator },
  handler: async (ctx, { section }): Promise<ContentDoc[]> => {
    const docs = await loadSorted(ctx, section);
    return docs.filter((d) => !d.isArchived);
  },
});

// ADMIN: everything including hidden items. Returns [] for non-admins
// instead of throwing so a sign-out never crashes the settings page.
export const listAdmin = query({
  args: { section: sectionValidator },
  handler: async (ctx, { section }): Promise<ContentDoc[]> => {
    const admin = await getAdmin(ctx);
    if (!admin) return [];
    return await loadSorted(ctx, section);
  },
});

// ---------------------------------------------------------------------------
// Mutations (admin only)
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    section: sectionValidator,
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, { section, imageUrl, imagePublicId, ...text }) => {
    const admin = await requireAdmin(ctx);
    const { title, description } = validateText(text.title, text.description);
    const existing = await loadSorted(ctx, section);
    const nextOrder =
      existing.length === 0 ? 0 : Math.max(...existing.map((d) => d.order)) + 1;
    return await ctx.db.insert(section, {
      title,
      description,
      imageUrl,
      imagePublicId,
      order: nextOrder,
      isArchived: false,
      createdAt: Date.now(),
      createdBy: admin._id,
    });
  },
});

export const update = mutation({
  args: {
    section: sectionValidator,
    id: v.string(),
    title: v.string(),
    description: v.string(),
    // Pass both as undefined to remove the photo.
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, { section, id, imageUrl, imagePublicId, ...text }) => {
    await requireAdmin(ctx);
    const item = await getItem(ctx, section, id);
    const { title, description } = validateText(text.title, text.description);

    if (item.imagePublicId && item.imagePublicId !== imagePublicId) {
      await deleteCloudinaryImage(ctx, item.imagePublicId);
    }

    await ctx.db.patch(item._id, {
      title,
      description,
      imageUrl,
      imagePublicId,
    });
  },
});

// Hide from / show on the public page without deleting.
export const setArchived = mutation({
  args: {
    section: sectionValidator,
    id: v.string(),
    isArchived: v.boolean(),
  },
  handler: async (ctx, { section, id, isArchived }) => {
    await requireAdmin(ctx);
    const item = await getItem(ctx, section, id);
    await ctx.db.patch(item._id, { isArchived });
  },
});

export const remove = mutation({
  args: { section: sectionValidator, id: v.string() },
  handler: async (ctx, { section, id }) => {
    await requireAdmin(ctx);
    const item = await getItem(ctx, section, id);
    await deleteCloudinaryImage(ctx, item.imagePublicId);
    await ctx.db.delete(item._id);
  },
});

// Swap an item with its neighbour. Order is shared by the public page and
// the hero carousel, so this also controls slide order.
export const move = mutation({
  args: {
    section: sectionValidator,
    id: v.string(),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, { section, id, direction }) => {
    await requireAdmin(ctx);
    const item = await getItem(ctx, section, id);
    const all = await loadSorted(ctx, section);
    const index = all.findIndex((d) => d._id === item._id);
    const neighbour = all[direction === "up" ? index - 1 : index + 1];
    if (index === -1 || !neighbour) return;

    // Re-number the whole list so orders are always unique and gap-free,
    // even if older rows ended up with duplicate `order` values.
    const reordered = [...all];
    reordered[index] = neighbour;
    reordered[direction === "up" ? index - 1 : index + 1] = item;
    for (let i = 0; i < reordered.length; i++) {
      const doc = reordered[i];
      if (doc.order !== i) await ctx.db.patch(doc._id, { order: i });
    }
  },
});

// One-click "load the starter content" for an empty section, so admins don't
// begin with a blank public page. Refuses to run if anything already exists.
export const seedDefaults = mutation({
  args: { section: sectionValidator },
  handler: async (ctx, { section }): Promise<number> => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query(section).first();
    if (existing) throw new Error("This section already has content");
    const defaults = DEFAULT_CONTENT[section];
    const now = Date.now();
    for (let i = 0; i < defaults.length; i++) {
      await ctx.db.insert(section, {
        title: defaults[i].title,
        description: defaults[i].description,
        order: i,
        isArchived: false,
        createdAt: now,
        createdBy: admin._id,
      });
    }
    return defaults.length;
  },
});

export type { ContentDoc };
export type ContentId = Id<"activities"> | Id<"amenities"> | Id<"aboutValues">;
