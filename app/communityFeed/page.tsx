"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityFeedPage() {
  const posts = useQuery(api.posts.getFeed);

  return (
    <div className="p-2 sm:p-4 lg:p-8 max-w-7xl mx-auto min-h-screen bg-transparent">
      <div className="mb-4 lg:mb-8 px-2">
        <h1 className="text-xl lg:text-3xl font-bold text-white mb-0.5">Community Feed</h1>
        <p className="text-gray-400 text-[11px] lg:text-base font-medium">Anonymous feedback</p>
      </div>

      {!posts ? (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[240px] w-full rounded-2xl bg-gray-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-2 gap-y-3 sm:gap-4 lg:gap-6 pt-0">
          {posts.map((post) => (
            <PostCard 
              key={post._id} 
              isProfileView={false} // 🎯 Shows Report button here
              post={{
                id: post._id,
                userId: post.userId,
                image: post.imageUrl || "/placeholder.svg",
                name: post.name,
                age: post.age,
                city: post.city,
                context: post.text,
                greenFlags: post.greenFlags,
                redFlags: post.redFlags,
                replies: post.repliesCount,
                timestamp: "", 
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}