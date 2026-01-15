import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const readUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    let totalGreen = 0;
    let totalRed = 0;
    posts.forEach((p) => {
      totalGreen += p.greenFlags;
      totalRed += p.redFlags;
    });

    return {
      postCount: posts.length,
      greenFlags: totalGreen,
      redFlags: totalRed,
      posts: posts
    };
  },
});

export const storeUser = mutation({
  args: { pseudonym: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) return existingUser._id;

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? "",
      pseudonym: args.pseudonym,
      hasCompletedOnboarding: false,
      isApproved: false,
      createdAt: Date.now(),
      verificationStatus: "not_started",
      role: "user",
      isSubscribed: false,
      subscriptionPlan: "none",
    });
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    pseudonym: v.string(),
    hasCompletedOnboarding: v.boolean(),
    isApproved: v.boolean(),
    createdAt: v.number(),
    selfieUrl: v.optional(v.string()),
    idUrl: v.optional(v.string()),
    isSubscribed: v.optional(v.boolean()),
    subscriptionPlan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existingUser) return existingUser._id;
    return await ctx.db.insert("users", {
      ...args,
      verificationStatus: "not_started",
      role: "user",
    });
  },
});

export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (user) {
      if (user.selfieUrl) try { await ctx.storage.delete(user.selfieUrl as any); } catch {}
      if (user.idUrl) try { await ctx.storage.delete(user.idUrl as any); } catch {}
      await ctx.db.delete(user._id);
    }
  },
});

export const finishOnboarding = mutation({
  args: { 
    clerkId: v.string(),
    selfieStorageId: v.optional(v.id("_storage")),
    idStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      hasCompletedOnboarding: true,
      verificationStatus: "pending",
      ...(args.selfieStorageId && { selfieUrl: args.selfieStorageId }),
      ...(args.idStorageId && { idUrl: args.idStorageId }),
    });
  },
});