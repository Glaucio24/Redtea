import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * 🛡️ HELPER: Secure Admin Check
 * This function is private to this file. It checks the secure session 
 * token and confirms the user has "admin" in the database.
 */
async function getValidatedAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("❌ Unauthenticated: Please sign in.");
  }

  // Look up the user in the database by their secure Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("byClerkId", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  // CHECK: Does the user exist and do they have the admin role?
  if (!user || user.role !== "admin") {
    throw new Error("🚫 Unauthorized: You do not have admin privileges.");
  }

  return user;
}

// --- Query: Get ALL users with verification status ---
export const getAllUsersWithVerificationStatus = query({
  args: {}, 
  handler: async (ctx) => {
    // This call will now find the function above
    await getValidatedAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    const normalizedUsers = await Promise.all(
      users.map(async (u) => ({
        _id: u._id,
        name: u.name,
        pseudonym: u.pseudonym,
        email: u.email,
        selfieUrl: u.selfieUrl ? await ctx.storage.getUrl(u.selfieUrl) : undefined,
        idUrl: u.idUrl ? await ctx.storage.getUrl(u.idUrl) : undefined,
        createdAt: u.createdAt,
        isApproved: u.isApproved,
        verificationStatus: u.verificationStatus || "none",
      }))
    );

    return normalizedUsers;
  },
});

// --- Mutation: Approve a user ---
export const approveUser = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await getValidatedAdmin(ctx);

    await ctx.db.patch(args.targetUserId, {
      isApproved: true,
      verificationStatus: "approved",
    });

    await ctx.db.insert("adminActions", {
      adminId: admin.clerkId,
      actionType: "approve_user",
      targetUserId: args.targetUserId,
      timestamp: Date.now(),
    });

    return { success: true, message: "✅ User approved successfully." };
  },
});

// --- Mutation: Deny a user ---
export const denyUser = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await getValidatedAdmin(ctx);

    await ctx.db.patch(args.targetUserId, {
      isApproved: false,
      verificationStatus: "rejected",
      selfieUrl: undefined,
      idUrl: undefined,
    });

    await ctx.db.insert("adminActions", {
      adminId: admin.clerkId,
      actionType: "deny_user",
      targetUserId: args.targetUserId,
      timestamp: Date.now(),
    });

    return { success: true, message: "🚫 User verification rejected." };
  },
});

// --- Query: Get all posts (admin-only) ---
export const getAllPosts = query({
  args: {},
  handler: async (ctx) => {
    // 🎯 This is where your error was happening
    await getValidatedAdmin(ctx);

    const posts = await ctx.db.query("posts").collect();

    return posts.map((p) => ({
      _id: p._id,
      text: p.text,          
      age: p.age,            
      city: p.city,          
      greenFlags: p.greenFlags,
      redFlags: p.redFlags,
      userId: p.userId, 
      createdAt: p.createdAt,
      fileId: p.fileId,
    }));
  },
});