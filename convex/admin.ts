import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ✅ Use the environment variable from .env
const ADMIN_IDS = ["user_34bIUM8marHm5m0iuxAj38kow71"];
// --- Helper: Restrict access to admins only ---
function assertAdmin(clerkId: string) {
  if (!clerkId || !ADMIN_IDS.includes(clerkId)) {
    throw new Error("❌ Unauthorized: Admin access required.");
  }
}

// --- Query: Get all pending users (not approved yet) ---
export const getPendingUsers = query({
  args: { adminClerkId: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);

    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("byIsApproved", (q) => q.eq("isApproved", false))
      .collect();

    // Only return safe fields for the admin dashboard
    return pendingUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      pseudonym: u.pseudonym,
      email: u.email,
      selfieUrl: u.selfieUrl,
      idUrl: u.idUrl,
      createdAt: u.createdAt
    }));
  },
});

// --- Mutation: Approve a user ---
export const approveUser = mutation({
  args: {
    adminClerkId: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);

    await ctx.db.patch(args.targetUserId, { isApproved: true });

    // Log this action for audit trail
    await ctx.db.insert("adminActions", {
      adminId: args.adminClerkId,
      actionType: "approve_user",
      targetUserId: args.targetUserId,
      timestamp: Date.now(),
    });

    return { success: true, message: "✅ User approved successfully." };
  },
});

// --- Mutation: Deny or delete a user ---
export const denyUser = mutation({
  args: {
    adminClerkId: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);

    await ctx.db.delete(args.targetUserId);

    await ctx.db.insert("adminActions", {
      adminId: args.adminClerkId,
      actionType: "deny_user",
      targetUserId: args.targetUserId,
      timestamp: Date.now(),
    });

    return { success: true, message: "🚫 User denied and removed." };
  },
});

// --- Query: Get all posts (admin-only) ---
export const getAllPosts = query({
  args: { adminClerkId: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);

    const posts = await ctx.db.query("posts").collect();

    // Only return safe fields
    return posts.map((p) => ({
      _id: p._id,
      title: p.title,
      content: p.content,
      userId: p.userId, // optional: if you want to show author
      createdAt: p.createdAt,
    }));
  },
});
