import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel"; // Import Id type

// --- MUTATIONS ---

// 1. 🎯 ADDED: Handles the creation of a new post (from the SubmitPostPage)
export const createPost = mutation({
    args: {
        text: v.string(),
        age: v.number(),
        city: v.string(),
        fileId: v.optional(v.string()), // Storage ID from a file upload
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("Not authenticated");   
        }
        
        // Fetch the user's ID from your 'users' table using Clerk ID
        const loggedInUser = await ctx.db
            .query("users")
            .withIndex("byClerkId", (q) => q.eq("clerkId", user.subject))
            .unique();

        if (!loggedInUser) {
            throw new Error("User not found in database");
        }

        // Insert the new post
        const postId = await ctx.db.insert("posts", {
            userId: loggedInUser._id,
            text: args.text,
            age: args.age,
            city: args.city,
            fileId: args.fileId,
            greenFlags: 0,
            redFlags: 0,
            voters: [], // Initialize empty array
            createdAt: Date.now(), // Use the current time
        });

        return postId;
    }
});


// 2. 🎯 ADDED: Handles a user casting a green/red flag vote (from the PostCard component)
export const handleVote = mutation({
    args: {
        postId: v.id("posts"),
        userId: v.id("users"), // The user who is voting (your current user's Convex ID)
        voteType: v.union(v.literal("green"), v.literal("red"), v.null()), // green, red, or null (for unvoting)
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        let { voters, greenFlags, redFlags } = post;
        // Find the user's existing vote
        const existingVoteIndex = voters.findIndex(voter => voter.userId === args.userId);
        
        // 1. Remove existing vote if present
        if (existingVoteIndex !== -1) {
            const existingVote = voters[existingVoteIndex];
            voters.splice(existingVoteIndex, 1);
            if (existingVote.voteType === "green") {
                greenFlags--;
            } else {
                redFlags--;
            }
        }
        
        // 2. Add new vote if not unvoting (args.voteType is not null)
        if (args.voteType !== null) {
            voters.push({ userId: args.userId as Id<"users">, voteType: args.voteType });
            if (args.voteType === "green") {
                greenFlags++;
            } else {
                redFlags++;
            }
        }

        // 3. Update the database
        await ctx.db.patch(args.postId, {
            greenFlags,
            redFlags,
            voters,
        });
    }
});

// EXISTING ADMIN FUNCTION
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

// EXISTING ADMIN FUNCTION
export const getAllPosts = query({
  args: { adminClerkId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("posts").order("desc").collect();
    return posts;
  },
});

// 3. 🎯 ADDED: Fetches the main feed, joining post data with creator info and replies count
export const getFeed = query({
    handler: async (ctx) => {
        // Fetch all posts ordered by creation time (newest first)
        const rawPosts = await ctx.db.query("posts").order("desc").collect();

        // Hydrate posts with user data and replies count
        const postsWithDetails = await Promise.all(rawPosts.map(async (post) => {
            const creator = await ctx.db.get(post.userId);

            // Count replies for each post
            const comments = await ctx.db
                .query("comments")
                .withIndex("byPostId", (q) => q.eq("postId", post._id))
                .collect();
            
            return {
                ...post,
                creatorName: creator?.pseudonym || creator?.name || "Anonymous",
                repliesCount: comments.length,
            };
        }));

        return postsWithDetails;
    }
});