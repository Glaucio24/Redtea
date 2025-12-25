import { mutation, query } from "./_generated/server";
import { v } from "convex/values";



const ADMIN_IDS = ["user_34jaXshstei5WLmw4N3vse2ecnI"];
// --- Helper: Restrict access to admins only ---
function assertAdmin(clerkId: string) {
  if (!clerkId || !ADMIN_IDS.includes(clerkId)) {
    throw new Error("❌ Unauthorized: Admin access required.");
  }
}

// --- Query: Get ALL users with verification status (PAGINATED) ---
export const getAllUsersWithVerificationStatus = query({
  args: { 
    adminClerkId: v.string(),
   
},
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);    
    // Fetch users using the paginate function
    const users= await ctx.db 
        .query("users")
        .order("desc") // Order by '_creationTime' index descending (newest first)
        .collect();

    // Map and normalize the users on the current page
    const normalizedUsers = await Promise.all(users.map(async(u) => ({
      _id: u._id,
      name: u.name,
      pseudonym: u.pseudonym,
      email: u.email,
      selfieUrl: u.selfieUrl ? await ctx.storage.getUrl(u.selfieUrl): undefined,
      idUrl: u.idUrl ? await ctx.storage.getUrl(u.idUrl): undefined,
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
    adminClerkId: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);

    // ✅ Set both flags for approval
    await ctx.db.patch(args.targetUserId, { 
      isApproved: true, 
      verificationStatus: "approved" 
    });

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

// --- Mutation: Deny a user (PATCHES STATUS, DOES NOT DELETE) ---
export const denyUser = mutation({
  args: {
    adminClerkId: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminClerkId);

    // 🛑 STOP DELETING! Patch status to "rejected" and clear documents.
    await ctx.db.patch(args.targetUserId, {
      isApproved: false,
      verificationStatus: "rejected", // Set explicit status
      selfieUrl: undefined, // Clear submitted documents
      idUrl: undefined,
    });

    await ctx.db.insert("adminActions", {
      adminId: args.adminClerkId,
      actionType: "deny_user",
      targetUserId: args.targetUserId,
      timestamp: Date.now(),
    });

    return { success: true, message: "🚫 User verification rejected." }; 
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
      userId: p.userId, 
      createdAt: p.createdAt,
    }));
  },
});