import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// --- QUERIES ---

export const getReportedPosts = query({
  args: { 
    adminClerkId: v.string() 
  },
  handler: async (ctx, args) => {
    // 1. Get the SECURE identity from the Clerk Token
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated: Please log in.");
    }

    // 2. Fetch the user from the DB using the SECURE identity subject
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // 3. Verify the role in your database
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required.");
    }

    // 4. If they pass, then return the sensitive data
    const reportedPosts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isReported"), true))
      .order("desc")
      .collect();

    return await Promise.all(reportedPosts.map(async (post) => {
      const creator = await ctx.db.get(post.userId);
      const imageUrl = post.fileId ? await ctx.storage.getUrl(post.fileId) : null;
      return {
        ...post,
        imageUrl,
        creatorName: creator?.pseudonym || "Anonymous",
        creatorId: creator?._id,
      };
    }));
  },
});

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const imageUrl = post.fileId ? await ctx.storage.getUrl(post.fileId) : null;

    const comments = await ctx.db
      .query("comments")
      .withIndex("byPostId", (q) => q.eq("postId", post._id))
      .collect();

    return { 
      ...post, 
      imageUrl,
      repliesCount: comments.length 
    };
  },
});

export const getFeed = query({
  handler: async (ctx) => {
    const rawPosts = await ctx.db.query("posts").order("desc").collect();
    return await Promise.all(rawPosts.map(async (post) => {
      const creator = await ctx.db.get(post.userId);
      const imageUrl = post.fileId ? await ctx.storage.getUrl(post.fileId) : null;
      const comments = await ctx.db
        .query("comments")
        .withIndex("byPostId", (q) => q.eq("postId", post._id))
        .collect();
      return {
        ...post,
        imageUrl, 
        creatorName: creator?.pseudonym || "Anonymous",
        repliesCount: comments.length,
      };
    }));
  }
});

export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rawPosts = await ctx.db
      .query("posts")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return await Promise.all(rawPosts.map(async (post) => {
      const imageUrl = post.fileId ? await ctx.storage.getUrl(post.fileId) : null;
      const comments = await ctx.db
        .query("comments")
        .withIndex("byPostId", (q) => q.eq("postId", post._id))
        .collect();
      return {
        ...post,
        imageUrl,
        repliesCount: comments.length,
      };
    }));
  }
});

// --- MUTATIONS ---

export const createPost = mutation({
  args: {
    name: v.string(),
    text: v.string(),
    age: v.number(),
    city: v.string(),
    fileId: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated"); 
    
    const loggedInUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!loggedInUser) throw new Error("User not found");

    return await ctx.db.insert("posts", {
      userId: loggedInUser._id,
      name: args.name,
      text: args.text,
      age: args.age,
      city: args.city,
      fileId: args.fileId,
      greenFlags: 0,
      redFlags: 0,
      voters: [], 
      reportCount: 0,
      isReported: false,
      createdAt: Date.now(),
    });
  }
});

export const handleVote = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"), 
    voteType: v.union(v.literal("green"), v.literal("red"), v.null()), 
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    let { voters, greenFlags, redFlags } = post;
    const existingVoteIndex = voters.findIndex(voter => voter.userId === args.userId);
    
    if (existingVoteIndex !== -1) {
      const existingVote = voters[existingVoteIndex];
      voters.splice(existingVoteIndex, 1);
      existingVote.voteType === "green" ? greenFlags-- : redFlags--;
    }
    
    if (args.voteType !== null) {
      voters.push({ userId: args.userId as Id<"users">, voteType: args.voteType });
      args.voteType === "green" ? greenFlags++ : redFlags++;
    }

    await ctx.db.patch(args.postId, { greenFlags, redFlags, voters });
  }
});

export const reportPost = mutation({
  args: { 
    postId: v.id("posts"),
    reason: v.string() 
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const currentReports = post.reportCount || 0;

    await ctx.db.patch(args.postId, {
      reportCount: currentReports + 1,
      isReported: true,
    });

    await ctx.db.insert("adminActions", {
      actionType: "report_post",
      targetPostId: args.postId,
      timestamp: Date.now(),
      adminId: "system_flag", 
    });
    
    return { success: true };
  },
});

/**
 * 🎯 ADMIN MUTATION: Clear reports if the post is safe.
 */
export const dismissReport = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      isReported: false,
      reportCount: 0,
    });
    return { success: true };
  },
});

export const deleteUserPost = mutation({
  args: { postId: v.id("posts"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.userId !== args.userId) throw new Error("Unauthorized");
    if (post.fileId) await ctx.storage.delete(post.fileId as Id<"_storage">);
    await ctx.db.delete(args.postId);
    return { success: true };
  },
});