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

    // 🎯 Maps through users and turns Storage IDs into viewable links
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

// --- Mutation: Deny and AUTO-DELETE (including all user posts) ---
export const denyUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    await getValidatedAdmin(ctx);

    const userToDelete = await ctx.db.get(args.targetUserId);
    if (!userToDelete) throw new Error("User record not found");

    // 1. Find and Delete all Posts created by this user
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    for (const post of userPosts) {
      // Delete post image from storage if it exists
      if (post.fileId) {
        await ctx.storage.delete(post.fileId as Id<"_storage">);
      }
      // Delete the post record
      await ctx.db.delete(post._id);
    }

    // 2. Delete user's verification files from storage
    if (userToDelete.selfieUrl) {
      await ctx.storage.delete(userToDelete.selfieUrl as Id<"_storage">);
    }
    if (userToDelete.idUrl) {
      await ctx.storage.delete(userToDelete.idUrl as Id<"_storage">);
    }

    // 3. Delete the user record from the database
    await ctx.db.delete(args.targetUserId);

    return { success: true, message: "User rejected and all associated content purged." };
  },
});