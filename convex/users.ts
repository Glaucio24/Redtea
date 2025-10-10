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
