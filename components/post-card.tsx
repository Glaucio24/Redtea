"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageCircle, Flag, CheckCircle2, Trash2, AlertCircle, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

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
  hideFooter?: boolean; // Used in [postId] page to hide redundancy
}

export function PostCard({ post, isProfileView = false, hideFooter = false }: PostCardProps) {
  const { user } = useUser();
  const [isReporting, setIsReporting] = useState(false);
  const [showReportReasons, setShowReportReasons] = useState(false);
  
  const livePost = useQuery(api.posts.getPostById, { postId: post.id as Id<"posts"> });
  const currentUser = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  
  const reportMutation = useMutation(api.posts.reportPost);
  const deleteMutation = useMutation(api.posts.deleteUserPost);
  const voteMutation = useMutation(api.posts.handleVote);

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
              e.preventDefault();
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
              e.preventDefault();
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
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <p className="text-white font-bold mb-3 text-sm">Why are you reporting this?</p>
          <div className="grid grid-cols-1 gap-2 w-full max-w-[180px]">
            {["Inappropriate Content", "Spam", "Harassment", "Fake Profile"].map((reason) => (
              <button
                key={reason}
                disabled={isReporting}
                onClick={(e) => {
                  e.preventDefault();
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

      {/* 🎯 IMAGE HEADER WITH DESCRIPTION OVERLAY */}
      <Link href={`/post/${post.id}`} className="block relative aspect-square w-full bg-gray-800 m-0 p-0 overflow-hidden shrink-0 group/img">
        <Image 
          src={post.image} 
          alt={post.name} 
          fill 
          className="object-cover block transition-transform duration-500 group-hover/img:scale-110" 
          unoptimized 
        />
        {/* 🎯 Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="text-sm sm:text-lg font-bold text-white truncate leading-tight">{post.name}, {post.age}</h3>
          <p className="text-[10px] sm:text-xs text-gray-400 truncate tracking-wide mb-2">{post.city}</p>
          
          {/* 🎯 DESCRIPTION INSIDE PICTURE (Hidden when hideFooter is true) */}
          {!hideFooter && (
            <p className="text-gray-200 text-[11px] sm:text-xs leading-snug line-clamp-2 opacity-90 group-hover/img:opacity-100 transition-opacity">
               {post.context}
            </p>
          )}
        </div>
      </Link>

      {/* VOTING FOOTER */}
      <div className={cn(
        "p-3 sm:px-4 flex items-center justify-between mt-auto",
        !hideFooter && "border-t border-gray-800/40" // Only show border if not hidden
      )}>
        <div className="flex gap-2 sm:gap-4">
          {/* GREEN FLAG BUTTON */}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote("green"); }} 
            className="flex items-center gap-1 group/btn cursor-pointer relative z-30"
          >
            <div className="p-1.5 rounded-full bg-green-500/10 text-green-500 group-hover/btn:bg-green-500 group-hover/btn:text-white transition-colors">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-[11px] sm:text-sm font-bold text-green-500">{displayGreen}</span>
          </button>

          {/* RED FLAG BUTTON */}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote("red"); }} 
            className="flex items-center gap-1 group/btn cursor-pointer relative z-30"
          >
            <div className="p-1.5 rounded-full bg-red-500/10 text-red-500 group-hover/btn:bg-red-500 group-hover/btn:text-white transition-colors">
              <AlertCircle size={16} />
            </div>
            <span className="text-[11px] sm:text-sm font-bold text-red-500">{displayRed}</span>
          </button>
        </div>

        {/* 🎯 REPLIES ICON (Hidden on detail page via hideFooter prop) */}
        {!hideFooter && (
          <Link 
            href={`/post/${post.id}`}
            className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors shrink-0"
          >
            <MessageCircle size={16} />
            <span className="text-[11px] sm:text-sm font-bold">{displayReplies}</span>
          </Link>
        )}
      </div>
    </Card>
  );
}