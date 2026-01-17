import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCommentsByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("byPostId", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    return await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          userPseudonym: user?.pseudonym || "Anonymous",
        };
      })
    );
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(), 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.insert("comments", {
      postId: args.postId,
      userId: user._id,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});