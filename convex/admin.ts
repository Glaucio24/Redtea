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

// --- Mutation: The "Nuclear Option" (Delete User + Posts + Comments) ---
export const wipeUserCompletely = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await getValidatedAdmin(ctx);

    const userToDelete = await ctx.db.get(args.userId);
    if (!userToDelete) throw new Error("User record not found");

    // 1. Delete all Posts and their Images
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const post of userPosts) {
      if (post.fileId) {
        await ctx.storage.delete(post.fileId as Id<"_storage">);
      }
      await ctx.db.delete(post._id);
    }

    // 2. Delete all Comments (if your table is called "comments")
    const userComments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    for (const comment of userComments) {
      await ctx.db.delete(comment._id);
    }

    // 3. Delete Verification Files
    if (userToDelete.selfieUrl) {
      await ctx.storage.delete(userToDelete.selfieUrl as Id<"_storage">);
    }
    if (userToDelete.idUrl) {
      await ctx.storage.delete(userToDelete.idUrl as Id<"_storage">);
    }

    // 4. Final Delete
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

// --- Mutation: Toggle Ban ---
export const toggleUserBan = mutation({
  args: { userId: v.id("users"), isBanned: v.boolean() },
  handler: async (ctx, args) => {
    await getValidatedAdmin(ctx);
    await ctx.db.patch(args.userId, { isBanned: args.isBanned });
    return { success: true };
  },
});

// --- Query: Get all posts for a specific user ---
export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await getValidatedAdmin(ctx);
    return await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});