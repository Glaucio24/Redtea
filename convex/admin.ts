import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * 🛡️ ENTERPRISE GATEKEEPER
 */
async function getValidatedAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("❌ Unauthenticated: Access Denied.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user || user.role !== "admin") {
    throw new Error("🚫 Unauthorized: Admin privileges required.");
  }

  return user;
}

// --- Query: Get ALL users with verification status (FIXED IMAGE URLS) ---
export const getAllUsersWithVerificationStatus = query({
  args: {}, 
  handler: async (ctx) => {
    await getValidatedAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    // 🎯 FIX: This maps through users and turns Storage IDs into viewable links
    return await Promise.all(
      users.map(async (u) => ({
        ...u,
        selfieUrl: u.selfieUrl 
          ? await ctx.storage.getUrl(u.selfieUrl as Id<"_storage">) 
          : undefined,
        idUrl: u.idUrl 
          ? await ctx.storage.getUrl(u.idUrl as Id<"_storage">) 
          : undefined,
        verificationStatus: u.verificationStatus || "none",
      }))
    );
  },
});

// --- Mutation: Approve a user ---
export const approveUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    await getValidatedAdmin(ctx);

    await ctx.db.patch(args.targetUserId, {
      isApproved: true,
      verificationStatus: "approved",
    });

    return { success: true };
  },
});

// --- Mutation: Deny and AUTO-DELETE (as requested) ---
export const denyUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    await getValidatedAdmin(ctx);

    const userToDelete = await ctx.db.get(args.targetUserId);
    if (!userToDelete) throw new Error("User record not found");

    // 1. Delete actual files from storage to save space/protect privacy
    if (userToDelete.selfieUrl) {
      await ctx.storage.delete(userToDelete.selfieUrl as Id<"_storage">);
    }
    if (userToDelete.idUrl) {
      await ctx.storage.delete(userToDelete.idUrl as Id<"_storage">);
    }

    // 2. Delete the user from the database
    await ctx.db.delete(args.targetUserId);

    return { success: true, message: "User rejected and records purged." };
  },
});