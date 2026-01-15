import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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

// --- QUERIES ---

export const getFeed = query({
    handler: async (ctx) => {
        const rawPosts = await ctx.db.query("posts").order("desc").collect();

        return await Promise.all(rawPosts.map(async (post) => {
            const creator = await ctx.db.get(post.userId);

            // 🎯 NEW: Get the real URL for the image
            const imageUrl = post.fileId 
                ? await ctx.storage.getUrl(post.fileId) 
                : null;

            const comments = await ctx.db
                .query("comments")
                .withIndex("byPostId", (q) => q.eq("postId", post._id))
                .collect();
            
            return {
                ...post,
                imageUrl, // Pass this to PostCard
                creatorName: creator?.pseudonym || "Anonymous",
                repliesCount: comments.length,
            };
        }));
    }
});