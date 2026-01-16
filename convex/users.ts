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

// 🎯 FIX: Updated to count flags the user GAVE to others
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Get posts owned by the user
    const myPosts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();

    // 2. Scan ALL posts to see what this user has voted on
    const allPosts = await ctx.db.query("posts").collect();
    
    let totalGreenGiven = 0;
    let totalRedGiven = 0;

    allPosts.forEach((post) => {
      // Check the voters array inside each post
      const userVote = post.voters?.find((voter: any) => voter.userId === args.userId);
      if (userVote) {
        if (userVote.voteType === "green") totalGreenGiven++;
        if (userVote.voteType === "red") totalRedGiven++;
      }
    });

    return {
      postCount: myPosts.length,
      greenFlags: totalGreenGiven, // This is now flags YOU gave
      redFlags: totalRedGiven,     // This is now flags YOU gave
      posts: myPosts
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