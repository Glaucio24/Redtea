"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card"; // Verify this path matches your project
import { Input } from "@/components/ui/input";
import { Search, Loader2, SearchX } from "lucide-react";

// 🎯 Make sure this is "export default"
export default function SearchPage() {
  const [query, setQuery] = useState("");

  // Convex query handles the filtering logic
  const posts = useQuery(api.posts.getFeed, { searchTerm: query });

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 pt-10">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Check the <span className="text-red-600">Tea</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Search by name or city to see if anyone has shared a story. 
            Stay safe out there.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-gray-500" size={20} />
          </div>
          <Input
            type="text"
            placeholder="Search name or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-900 border-gray-800 h-14 pl-12 rounded-2xl text-lg focus:ring-red-600 focus:border-red-600 transition-all shadow-2xl"
          />
        </div>

        {/* Results Section */}
        {posts === undefined ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
            <p className="text-gray-500">Scanning for tea...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={{
                  id: post._id,
                  image: post.imageUrl || "",
                  name: post.name,
                  age: post.age,
                  city: post.city,
                  context: post.text,
                  greenFlags: post.greenFlags,
                  redFlags: post.redFlags,
                  replies: post.repliesCount,
                  timestamp: new Date(post.createdAt).toLocaleDateString(),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900/40 rounded-[3rem] border border-dashed border-gray-800">
            <SearchX className="mx-auto text-gray-700 mb-4" size={48} />
            <h3 className="text-xl font-medium text-gray-300">No tea found for "{query}"</h3>
            <p className="text-gray-500 mt-2">Maybe they're actually a nice person? Or nobody has caught them yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}