"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageCircle, Flag, CheckCircle2, Trash2, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner"; // Or "use-toast" depending on your shadcn setup

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
    userId: string; 
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useUser();
  const [isReporting, setIsReporting] = useState(false);
  const currentUser = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  
  const voteMutation = useMutation(api.posts.handleVote);
  const deleteMutation = useMutation(api.posts.deleteUserPost);
  const reportMutation = useMutation(api.posts.reportPost);

  const isOwner = currentUser?._id === post.userId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this post permanently?")) return;
    
    const promise = deleteMutation({ postId: post.id as any, userId: currentUser!._id });
    
    toast.promise(promise, {
        loading: 'Deleting post...',
        success: 'Post deleted successfully',
        error: 'Failed to delete post',
    });
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReporting(true);
    
    try {
      await reportMutation({ postId: post.id as any });
      toast.success("Post reported", {
        description: "Our moderators will review this content shortly.",
      });
    } catch (err) {
      toast.error("Could not report", {
        description: "Please try again later.",
      });
    } finally {
      setIsReporting(false);
    }
  };

  const handleVoteAction = async (type: "green" | "red") => {
    if (!currentUser) return;
    try {
      await voteMutation({
        postId: post.id as any,
        userId: currentUser._id,
        voteType: type,
      });
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl bg-gray-900/50 border-gray-800 shadow-2xl transition-all hover:border-gray-700 h-full flex flex-col p-0 border-none group relative">
      
      {/* ACTION BUTTONS */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        {isOwner ? (
          <button onClick={handleDelete} className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full transition-all backdrop-blur-md border border-red-600/30">
            <Trash2 size={14} />
          </button>
        ) : (
          <button 
            disabled={isReporting}
            onClick={handleReport} 
            className="p-2 bg-gray-950/40 hover:bg-red-600 text-gray-300 hover:text-white rounded-full transition-all backdrop-blur-md border border-white/10 disabled:opacity-50"
          >
            {isReporting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
          </button>
        )}
      </div>

      <div className="relative aspect-square w-full bg-gray-800 m-0 p-0 overflow-hidden shrink-0">
        <Image src={post.image} alt={post.name} fill className="object-cover block transition-transform duration-500 group-hover:scale-110" unoptimized />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent p-3">
          <h3 className="text-sm sm:text-lg font-bold text-white truncate leading-tight">{post.name}, {post.age}</h3>
          <p className="text-[10px] sm:text-xs text-gray-300 truncate tracking-wide">{post.city}</p>
        </div>
      </div>

      <div className="p-3 pt-2 sm:p-4 sm:pt-3 flex flex-col flex-1 justify-between space-y-2.5">
        <p className="text-gray-300 text-[11px] sm:text-sm leading-snug line-clamp-2">{post.context}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/40 mt-auto">
          <div className="flex gap-2 sm:gap-4">
            <button onClick={(e) => { e.stopPropagation(); handleVoteAction("green"); }} className="flex items-center gap-1 group/btn bg-transparent border-none outline-none">
              <div className="p-1 rounded-full bg-green-500/10 text-green-500 group-hover/btn:bg-green-500 transition-colors">
                <CheckCircle2 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-green-500">{post.greenFlags}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleVoteAction("red"); }} className="flex items-center gap-1 group/btn bg-transparent border-none outline-none">
              <div className="p-1 rounded-full bg-red-500/10 text-red-500 group-hover/btn:bg-red-500 transition-colors">
                <AlertCircle size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-red-500">{post.redFlags}</span>
            </button>
          </div>
          <div className="flex items-center gap-1 text-gray-500 shrink-0">
            <MessageCircle size={14} className="sm:w-[16px] sm:h-[16px]" />
            <span className="text-[11px] sm:text-sm font-bold">{post.replies}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}