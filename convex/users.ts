import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// --- 🚀 NEW: SYNC/UPSERT USER (Handles first-time login automatically) ---
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        // We don't overwrite onboarding/verification status here
      });
      return existingUser._id;
    }

    // Default values for a brand new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      pseudonym: args.name.split(" ")[0] + Math.floor(Math.random() * 1000), // Default pseudonym
      isApproved: false,
      hasCompletedOnboarding: false,
      verificationStatus: "none",
      createdAt: Date.now(),
    });
  },
});

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
    verificationStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newUser = await ctx.db.insert("users", {
      ...args,
      verificationStatus: args.verificationStatus || "none",
    });
    return newUser;
  },
});

// --- READ USER (FIXED: Returns null instead of throwing) ---
export const readUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // ✅ Removed the throw error. Returning null allows the frontend 
    // to show a loading state or redirect to onboarding.
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

    await ctx.db.patch(user._id, {
      isApproved: args.isApproved,
      verificationStatus: args.isApproved ? "approved" : "rejected",
    });

    return { success: true };
  },
});

// --- UPDATE SUBSCRIPTION ---
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

// --- GET APPROVED USERS ---
export const getApprovedUsers = query({
  handler: async (ctx) => {
    // Note: Ensure you have an index "byIsApproved" in schema.ts
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

// --- FINISH ONBOARDING ---
export const finishOnboarding = mutation({
  args: {
    clerkId: v.string(),
    selfieUrl: v.optional(v.id("_storage")),
    idUrl: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existingUser) {
      throw new Error("User record not found during onboarding update.");
    }

    const updates: any = {
      hasCompletedOnboarding: true,
      verificationStatus: "pending",
    };

    if (args.selfieUrl !== undefined) updates.selfieUrl = args.selfieUrl;
    if (args.idUrl !== undefined) updates.idUrl = args.idUrl;

    await ctx.db.patch(existingUser._id, updates);

    return { success: true };
  },
});

// --- UPDATE VERIFICATION DOCUMENTS ---
export const updateVerificationDocuments = mutation({
  args: {
    clerkId: v.string(),
    selfieStorageId: v.optional(v.id("_storage")),
    idStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existingUser) throw new Error("User record not found for update.");

    const updates: {
      selfieUrl?: Id<"_storage">;
      idUrl?: Id<"_storage">;
      verificationStatus?: "pending";
    } = {};

    if (args.selfieStorageId) {
      updates.selfieUrl = args.selfieStorageId;
      updates.verificationStatus = "pending";
    }

    if (args.idStorageId) {
      updates.idUrl = args.idStorageId;
      updates.verificationStatus = "pending";
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existingUser._id, updates);
    }

    return { success: true };
  },
});