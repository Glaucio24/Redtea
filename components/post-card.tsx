"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Flag, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

interface PostCardProps {
  post: {
    id: string;
    image: string;
    name: string;
    age: number;
    city: string;
    context: string;
    greenFlags: number;
    redFlags: number;
    replies: number;
    timestamp: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useUser();
  
  // Get the current user's Convex ID to associate with the vote
  const currentUser = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  const voteMutation = useMutation(api.posts.handleVote);

  const handleVoteAction = async (type: "green" | "red") => {
    if (!currentUser) return;
    
    try {
      await voteMutation({
        postId: post.id as any,
        userId: currentUser._id,
        voteType: type,
      });
    } catch (err) {
      console.error("Error casting vote:", err);
    }
  };

  return (
    <Card className="overflow-hidden rounded-3xl bg-gray-900 border-gray-800 shadow-2xl transition-all hover:border-gray-700">
      {/* Image Header */}
      <div className="relative aspect-square w-full bg-gray-800">
        <Image
          src={post.image}
          alt={post.name}
          fill
          className="object-cover"
          unoptimized // Useful if using external Convex storage URLs
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950/90 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {post.name}, {post.age}
              </h3>
              <p className="text-sm text-gray-300">{post.city}</p>
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-none px-3 py-1">
              {post.timestamp}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
          {post.context}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-4">
            {/* Green Flag Button */}
            <button 
              onClick={() => handleVoteAction("green")}
              className="flex items-center gap-1.5 group cursor-pointer bg-transparent border-none outline-none"
            >
              <div className="p-2 rounded-full bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-sm font-semibold text-green-500">{post.greenFlags}</span>
            </button>

            {/* Red Flag Button */}
            <button 
              onClick={() => handleVoteAction("red")}
              className="flex items-center gap-1.5 group cursor-pointer bg-transparent border-none outline-none"
            >
              <div className="p-2 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Flag size={18} />
              </div>
              <span className="text-sm font-semibold text-red-500">{post.redFlags}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-gray-400">
            <MessageCircle size={18} />
            <span className="text-sm">{post.replies} replies</span>
          </div>
        </div>
      </div>
    </Card>
  );
}