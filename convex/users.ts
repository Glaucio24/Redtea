import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- CREATE USER ---
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    pseudonym: v.string(),
    selfieUrl: v.optional(v.string()),
    idUrl: v.optional(v.string()),
    isApproved: v.boolean(),
    hasCompletedOnboarding: v.boolean(),
    isSubscribed: v.optional(v.boolean()),
    subscriptionPlan: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const newUser = await ctx.db.insert("users", {
      ...args,
    });
    return newUser;
  },
});

// --- READ USER ---
export const readUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error(`User not found for clerkId: ${args.clerkId}`);
    return user;
  },
});

// --- ADMIN: APPROVE USER ---
export const markApproved = mutation({
  args: { clerkId: v.string(), isApproved: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { isApproved: args.isApproved });
    return { success: true };
  },
});

// --- UPDATE SUBSCRIPTION (Polar webhook or client side) ---
export const markSubscribed = mutation({
  args: { clerkId: v.string(), isSubscribed: v.boolean(), subscriptionPlan: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      isSubscribed: args.isSubscribed,
      subscriptionPlan: args.subscriptionPlan,
    });
    return { success: true };
  },
});

// --- GET APPROVED USERS (for admin dashboard) ---
export const getApprovedUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("byIsApproved", (q) => q.eq("isApproved", true))
      .collect();
    return users;
  },
});

// --- DELETE USER ---
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) await ctx.db.delete(user._id);
    return true;
  },
});

// Add this to your Convex file (e.g., users.ts)
export const finishOnboarding = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    pseudonym: v.string(),
    selfieUrl: v.optional(v.string()),
    idUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Find the existing user record created by the Clerk webhook
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existingUser) {
      // This is a critical error if the webhook ran correctly
      throw new Error("User record not found during onboarding update. Webhook might have failed.");
    }

    // 2. Patch the record with onboarding data
    await ctx.db.patch(existingUser._id, {
      name: args.name,
      pseudonym: args.pseudonym,
      selfieUrl: args.selfieUrl,
      idUrl: args.idUrl,
      hasCompletedOnboarding: true, // Mark onboarding complete
    });
    
    return { success: true };
  },
});

