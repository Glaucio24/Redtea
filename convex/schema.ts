import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  //users table with subscription and verification status (NO CHANGES HERE)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),                // Real name
    pseudonym: v.string(),           // Anonymous identity
    selfieUrl: v.optional(v.string()),
    idUrl: v.optional(v.string()),
    isApproved: v.boolean(),         // Admin approval
    hasCompletedOnboarding: v.boolean(),
    isSubscribed: v.optional(v.boolean()), // New: Polar subscription
    subscriptionPlan: v.optional(v.string()), // optional: "basic", "premium", etc.
    createdAt: v.number(),
    verificationStatus: v.string(),
    role: v.optional(v.string()),
  })
    .index("byClerkId", ["clerkId"])
    .index("byIsApproved", ["isApproved"])
    .index("byVerificationStatus", ["verificationStatus"]),

 
  posts: defineTable({
    userId: v.id("users"),
    name: v.string(), // Added name for the PostCard header
    text: v.string(), // Renamed 'content' to 'text' to match component logic
    age: v.number(), // Added age for the PostCard header
    city: v.string(), // Added city for the PostCard header
    fileId: v.optional(v.string()), // Convex Storage ID for the media (image/video)
  

    // Voting mechanism
    greenFlags: v.number(),
    redFlags: v.number(),
    voters: v.array(v.object({ // Tracks which user voted what
        userId: v.id("users"),
        voteType: v.union(v.literal("green"), v.literal("red")),
    })),

    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byCreatedAt", ["createdAt"]),

  comments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("byPostId", ["postId"])
    .index("byUserId", ["userId"])
    .index("byCreatedAt", ["createdAt"]), // Added to easily count/fetch replies

  adminActions: defineTable({
    adminId: v.string(),
    actionType: v.string(), // "approve_user", "delete_post", etc.
    targetUserId: v.optional(v.id("users")),
    targetPostId: v.optional(v.id("posts")),
    targetCommentId: v.optional(v.id("comments")),
    timestamp: v.number(),
  }),

  payments: defineTable({
    userId: v.id("users"),
    paymentProvider: v.string(), // "polar"
    paymentId: v.string(),
    status: v.string(),          // "pending" | "completed" | "failed"
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
});