// convex/users.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized – no identity found");

    const clerkId = identity.subject;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (existing) return existing;

    const email = typeof identity.email === "string" ? identity.email : "";
    const name =
      typeof identity.name === "string"
        ? identity.name
        : typeof identity.givenName === "string"
          ? identity.givenName
          : "Unknown User";
    const imageUrl =
      typeof identity.pictureUrl === "string"
        ? identity.pictureUrl
        : typeof identity.picture === "string"
          ? identity.picture
          : undefined;

    // First user in the whole system -> admin. Everyone else -> user.
    const anyUserExists = await ctx.db.query("users").first();
    const role: "admin" | "user" = anyUserExists ? "user" : "admin";

    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      imageUrl,
      role,
      createdAt: Date.now(),
    });
    return await ctx.db.get(userId);
  },
});

export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return (
      (await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first()) ?? null
    );
  },
});
