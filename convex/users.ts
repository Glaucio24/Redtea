import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Helper to verify if the requester is an Admin.
 */
async function validateAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  
  // 🎯 DEBUG: Check your console logs to see what identity Convex is getting
  console.log("Identity:", identity?.subject);

  if (!identity) {
    // If you are testing locally and want to bypass this once, 
    // you can uncomment the next line, but ONLY for a moment:
    // return; 
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  // If the user doesn't exist or isn't an admin, block them.
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

// --- 🚀 CREATE USER (Matches Schema & Webhook Payload) ---
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    pseudonym: v.string(),
    isApproved: v.boolean(),
    hasCompletedOnboarding: v.boolean(),
    createdAt: v.number(),
    role: v.optional(v.string()),
    verificationStatus: v.optional(v.string()),
    isSubscribed: v.optional(v.boolean()),
    subscriptionPlan: v.optional(v.string()),
    selfieUrl: v.optional(v.id("_storage")),
    idUrl: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { 
        name: args.name, 
        email: args.email 
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      ...args,
      verificationStatus: args.verificationStatus ?? "none",
      role: args.role ?? "user",
      isSubscribed: args.isSubscribed ?? false,
    });
  },
});

// --- COMPLETE ONBOARDING ---
export const finishOnboarding = mutation({
  args: {
    clerkId: v.string(),
    selfieStorageId: v.optional(v.id("_storage")),
    idStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) {
      throw new Error("Unauthorized onboarding attempt");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      // Create user if they don't exist yet
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: identity.email || "unknown",
        name: identity.name || "Unknown User",
        pseudonym: "User" + Math.floor(Math.random() * 1000),
        isApproved: false,
        hasCompletedOnboarding: true,
        verificationStatus: "pending",
        createdAt: Date.now(),
        role: "user",
        selfieUrl: args.selfieStorageId,
        idUrl: args.idStorageId,
      });
    } else {
      await ctx.db.patch(user._id, {
        hasCompletedOnboarding: true,
        verificationStatus: "pending",
        selfieUrl: args.selfieStorageId,
        idUrl: args.idStorageId,
      });
    }
    return { success: true };
  },
});

// --- ADMIN: GET ALL USERS ---
export const getPendingUsers = query({
  handler: async (ctx) => {
    await validateAdmin(ctx);
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("hasCompletedOnboarding"), true))
      .collect();
  },
});

// --- ADMIN: APPROVE USER ---
export const markApproved = mutation({
  args: { clerkId: v.string(), isApproved: v.boolean() },
  handler: async (ctx, args) => {
    await validateAdmin(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      isApproved: args.isApproved,
      verificationStatus: args.isApproved ? "approved" : "rejected",
    });
  },
});

// --- READ CURRENT USER ---
export const readUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// --- DELETE USER ---
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await validateAdmin(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) await ctx.db.delete(user._id);
    return true;
  },
});