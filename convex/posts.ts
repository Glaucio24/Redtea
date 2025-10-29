import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllPosts = query({
  args: { adminClerkId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("posts").order("desc").collect();
    return posts;
  },
});

export const deletePost = mutation({
  args: { adminClerkId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.postId);
    await ctx.db.insert("adminActions", {
      adminId: args.adminClerkId,
      actionType: "delete_post",
      targetPostId: args.postId,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});
