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

// --- Mutation: Wipe User Completely ---

export const wipeUserCompletely = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Get the Identity of the person calling this function
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 2. Find the caller in the database
    const caller = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!caller) throw new Error("Caller record not found");

    // 3. PERMISSION CHECK: Allow if Caller is Admin OR Caller is deleting themselves
    const isAdmin = caller.role?.toLowerCase() === "admin";
    const isSelfDestruct = caller._id === args.userId;

    if (!isAdmin && !isSelfDestruct) {
      throw new Error("🚫 Unauthorized: You do not have permission to wipe this record.");
    }

    // 4. PREVENT ADMIN FROM ACCIDENTALLY DELETING THEMSELVES VIA DASHBOARD
    if (isAdmin && isSelfDestruct && caller.role === "admin") {
       // Optional: You might want to allow this if you want admins to be able to delete themselves
       // throw new Error("Admins must be downgraded to user before self-deletion for safety.");
    }

    const userToDelete = await ctx.db.get(args.userId);
    if (!userToDelete) return { success: false, error: "User not found" };

    // 5. DELETE ALL POSTS & IMAGES
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const post of userPosts) {
      if (post.fileId) {
        try { await ctx.storage.delete(post.fileId as Id<"_storage">); } catch (e) {}
      }
      await ctx.db.delete(post._id);
    }

    // 6. DELETE ALL COMMENTS
    const userComments = await ctx.db
      .query("comments")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const comment of userComments) {
      await ctx.db.delete(comment._id);
    }

    // 7. DELETE STORAGE FILES (Selfie & ID)
    if (userToDelete.selfieUrl) {
      try { await ctx.storage.delete(userToDelete.selfieUrl as Id<"_storage">); } catch (e) {}
    }
    if (userToDelete.idUrl) {
      try { await ctx.storage.delete(userToDelete.idUrl as Id<"_storage">); } catch (e) {}
    }

    // 8. FINAL WIPE: Delete the user record
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