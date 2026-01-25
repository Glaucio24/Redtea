import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    pseudonym: v.string(),
    selfieUrl: v.optional(v.string()),
    idUrl: v.optional(v.string()),
    isApproved: v.boolean(),
    isBanned: v.optional(v.boolean()), // 🎯 ADDED THIS
    hasCompletedOnboarding: v.boolean(),
    isSubscribed: v.optional(v.boolean()),
    subscriptionPlan: v.optional(v.string()),
    createdAt: v.number(),
    verificationStatus: v.string(),
    role: v.optional(v.string()),
  })
    .index("byClerkId", ["clerkId"])
    .index("byIsApproved", ["isApproved"])
    .index("byVerificationStatus", ["verificationStatus"]),

  posts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    text: v.string(),
    age: v.number(),
    city: v.string(),
    fileId: v.optional(v.string()),
    greenFlags: v.number(),
    redFlags: v.number(),
    voters: v.array(v.object({
        userId: v.id("users"),
        voteType: v.union(v.literal("green"), v.literal("red")),
    })),
    isReported: v.optional(v.boolean()),
    reportCount: v.optional(v.number()),
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
    .index("byCreatedAt", ["createdAt"]),

  adminActions: defineTable({
    adminId: v.string(),
    actionType: v.string(),
    targetUserId: v.optional(v.id("users")),
    targetPostId: v.optional(v.id("posts")),
    targetCommentId: v.optional(v.id("comments")),
    timestamp: v.number(),
  }),

  payments: defineTable({
    userId: v.id("users"),
    paymentProvider: v.string(),
    paymentId: v.string(),
    status: v.string(),
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
});