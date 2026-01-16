"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityFeedPage() {
  // Use the query we just updated in convex/posts.ts
  const posts = useQuery(api.posts.getFeed);

  return (
    /* 🎯 FIX 1: Changed bg-black to bg-transparent so it follows your main layout color */
    <div className="p-2 sm:p-4 lg:p-8 max-w-7xl mx-auto min-h-screen bg-transparent">
      
      {/* 🎯 Tightened Header Section */}
      <div className="mb-4 lg:mb-8 px-2">
        <h1 className="text-xl lg:text-3xl font-bold text-white mb-0.5">Community Feed</h1>
        <p className="text-gray-400 text-[11px] lg:text-base font-medium">
          Anonymous feedback
        </p>
      </div>

      {!posts ? (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i} 
              className="h-[240px] sm:h-[400px] w-full rounded-2xl sm:rounded-3xl bg-gray-800/50" 
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-sm">No posts yet. Be the first!</p>
        </div>
      ) : (
        /* 🎯 FIX 2: Added pt-0 and tightened the grid to ensure zero top gap for the cards */
        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-2 gap-y-3 sm:gap-4 lg:gap-6 pt-0">
          {posts?.map((post) => (
            /* h-fit ensures the container doesn't create extra space below the card */
            <div key={post._id} className="w-full h-fit">
              <PostCard 
                post={{
                  id: post._id,
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}