import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const readUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const myPosts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();

    const allPosts = await ctx.db.query("posts").collect();
    
    let totalGreenGiven = 0;
    let totalRedGiven = 0;

    allPosts.forEach((post) => {
      // ✅ Removed 'any' - using inferred types from post.voters
      const userVote = post.voters?.find((voter) => voter.userId === args.userId);
      if (userVote) {
        if (userVote.voteType === "green") {
          totalGreenGiven += 1;
        } else if (userVote.voteType === "red") {
          totalRedGiven += 1;
        }
      }
    });

    return {
      postCount: myPosts.length,
      greenFlags: totalGreenGiven,
      redFlags: totalRedGiven,
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
      // ✅ Explicit casting to Id<"_storage">
      if (user.selfieUrl) {
        try { await ctx.storage.delete(user.selfieUrl as Id<"_storage">); } catch (e) { console.error(e); }
      }
      if (user.idUrl) {
        try { await ctx.storage.delete(user.idUrl as Id<"_storage">); } catch (e) { console.error(e); }
      }
      await ctx.db.delete(user._id);
    }
  },
});



export const rejectAndSoftDeleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    if (user.selfieUrl) {
      try { await ctx.storage.delete(user.selfieUrl as Id<"_storage">); } catch (e) { console.error(e); }
    }
    if (user.idUrl) {
      try { await ctx.storage.delete(user.idUrl as Id<"_storage">); } catch (e) { console.error(e); }
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    await ctx.db.delete(args.userId);
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