"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageCircle, Flag, CheckCircle2, Trash2, AlertCircle, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

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
  isProfileView?: boolean;
}

export function PostCard({ post, isProfileView = false }: PostCardProps) {
  const { user } = useUser();
  const [isReporting, setIsReporting] = useState(false);
  const [showReportReasons, setShowReportReasons] = useState(false);
  
  // LIVE SYNC: This makes the numbers change without refreshing
  const livePost = useQuery(api.posts.getPostById, { postId: post.id as Id<"posts"> });
  const currentUser = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  
  const reportMutation = useMutation(api.posts.reportPost);
  const deleteMutation = useMutation(api.posts.deleteUserPost);
  const voteMutation = useMutation(api.posts.handleVote);

  // Use live data if it exists, otherwise use the initial post data
  const displayGreen = livePost?.greenFlags ?? post.greenFlags;
  const displayRed = livePost?.redFlags ?? post.redFlags;
  const displayReplies = livePost?.repliesCount ?? post.replies;

  const handleReportAction = async (reason: string) => {
    setIsReporting(true);
    try {
      await reportMutation({ postId: post.id as Id<"posts">, reason });
      toast.success("Report Submitted");
      setShowReportReasons(false);
    } catch (err) {
      toast.error("Failed to report");
    } finally {
      setIsReporting(false);
    }
  };

  const onVote = async (type: "green" | "red") => {
    if (!currentUser) return toast.error("Please log in to vote");
    try {
      await voteMutation({
        postId: post.id as Id<"posts">,
        userId: currentUser._id,
        voteType: type,
      });
    } catch (err) {
      toast.error("Vote failed");
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl bg-gray-950 border-gray-800 shadow-2xl transition-all hover:border-gray-700 h-full flex flex-col p-0 border-none group relative">
      
      {/* ACTION BUTTONS (REPORT / DELETE) */}
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        {isProfileView ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if(confirm("Delete this post?")) {
                deleteMutation({ postId: post.id as Id<"posts">, userId: currentUser!._id });
                toast.success("Post deleted");
              }
            }} 
            className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full transition-all backdrop-blur-md border border-red-600/30"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowReportReasons(!showReportReasons);
            }} 
            className={`p-2 rounded-full transition-all backdrop-blur-md border border-white/10 z-40 ${showReportReasons ? 'bg-red-600 text-white' : 'bg-gray-950/40 text-gray-300 hover:bg-red-600'}`}
          >
            {showReportReasons ? <X size={14} /> : <Flag size={14} />}
          </button>
        )}
      </div>

      {/* REPORT REASONS OVERLAY */}
      {!isProfileView && showReportReasons && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200">
          <p className="text-white font-bold mb-3 text-sm">Why are you reporting this?</p>
          <div className="grid grid-cols-1 gap-2 w-full max-w-[180px]">
            {["Inappropriate Content", "Spam", "Harassment", "Fake Profile"].map((reason) => (
              <button
                key={reason}
                disabled={isReporting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReportAction(reason);
                }}
                className="text-[11px] py-2 px-3 bg-gray-800 hover:bg-red-600 text-white rounded-lg transition-colors border border-gray-700 flex items-center justify-center"
              >
                {isReporting ? <Loader2 size={12} className="animate-spin" /> : reason}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Header */}
      <div className="relative aspect-square w-full bg-gray-800 m-0 p-0 overflow-hidden shrink-0">
        <Image src={post.image} alt={post.name} fill className="object-cover block transition-transform duration-500 group-hover:scale-110" unoptimized />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent p-3">
          <h3 className="text-sm sm:text-lg font-bold text-white truncate leading-tight">{post.name}, {post.age}</h3>
          <p className="text-[10px] sm:text-xs text-gray-300 truncate tracking-wide">{post.city}</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 pt-2 sm:p-4 sm:pt-3 flex flex-col flex-1 justify-between space-y-2.5">
        <p className="text-gray-300 text-[11px] sm:text-sm leading-snug line-clamp-2">{post.context}</p>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/40 mt-auto">
          <div className="flex gap-2 sm:gap-4 z-20">
            {/* GREEN FLAG */}
            <button 
              onClick={(e) => { e.stopPropagation(); onVote("green"); }} 
              className="flex items-center gap-1 group/btn bg-transparent border-none outline-none cursor-pointer relative z-30"
            >
              <div className="p-1.5 rounded-full bg-green-500/10 text-green-500 group-hover/btn:bg-green-500 group-hover/btn:text-white transition-colors">
                <CheckCircle2 size={16} />
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-green-500">{displayGreen}</span>
            </button>

            {/* RED FLAG */}
            <button 
              onClick={(e) => { e.stopPropagation(); onVote("red"); }} 
              className="flex items-center gap-1 group/btn bg-transparent border-none outline-none cursor-pointer relative z-30"
            >
              <div className="p-1.5 rounded-full bg-red-500/10 text-red-500 group-hover/btn:bg-red-500 group-hover/btn:text-white transition-colors">
                <AlertCircle size={16} />
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-red-500">{displayRed}</span>
            </button>
          </div>

          {/* REPLIES */}
          <div className="flex items-center gap-1 text-gray-500 shrink-0">
            <MessageCircle size={16} />
            <span className="text-[11px] sm:text-sm font-bold">{displayReplies}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}