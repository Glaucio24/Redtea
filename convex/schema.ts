import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),                // Real name
    pseudonym: v.string(),           // Anonymous identity
    selfieUrl: v.optional(v.string()),
    idUrl: v.optional(v.string()),
    isApproved: v.boolean(),         // Admin approval
    hasCompletedOnboarding: v.boolean(),
    isSubscribed: v.optional(v.boolean()), // New: Polar subscription
    subscriptionPlan: v.optional(v.string()), // optional: "basic", "premium", etc.
    createdAt: v.number(),
  })
    .index("byClerkId", ["clerkId"])
    .index("byIsApproved", ["isApproved"]),

  posts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
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
    .index("byUserId", ["userId"]),

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
    status: v.string(),          // "pending" | "completed" | "failed"
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
});
