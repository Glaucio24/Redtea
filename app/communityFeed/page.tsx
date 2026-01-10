"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityFeedPage() {
  // Use the query we just updated in convex/posts.ts
  const posts = useQuery(api.posts.getFeed);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Community Feed</h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Anonymous feedback from the community
        </p>
      </div>

      {!posts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-3xl bg-gray-800/50" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p>No posts yet. Be the first to ask for feedback!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={{
                id: post._id,
                image: post.imageUrl || "/placeholder.svg",
                name: post.creatorName,
                age: post.age,
                city: post.city,
                context: post.text,
                greenFlags: post.greenFlags,
                redFlags: post.redFlags,
                replies: post.repliesCount,
                timestamp: new Date(post.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}