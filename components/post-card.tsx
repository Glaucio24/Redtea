"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageCircle, Flag, CheckCircle2, Trash2, AlertCircle, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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
  const [showReportReasons, setShowReportReasons] = useState(false);
  
  const currentUser = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  const reportMutation = useMutation(api.posts.reportPost);
  const deleteMutation = useMutation(api.posts.deleteUserPost);
  const voteMutation = useMutation(api.posts.handleVote);

  const isOwner = currentUser?._id === post.userId;

  const handleReportAction = async (reason: string) => {
    setIsReporting(true);
    try {
      await reportMutation({ postId: post.id as any, reason });
      toast.success("Report Submitted", { description: `Flagged for: ${reason}` });
      setShowReportReasons(false);
    } catch (err) {
      toast.error("Failed to report");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl bg-gray-900/50 border-gray-800 shadow-2xl transition-all hover:border-gray-700 h-full flex flex-col p-0 border-none group relative">
      
      {/* ACTION BUTTONS */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        {isOwner ? (
          <button onClick={() => confirm("Delete?") && deleteMutation({ postId: post.id as any, userId: currentUser!._id })} className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full transition-all backdrop-blur-md border border-red-600/30">
            <Trash2 size={14} />
          </button>
        ) : (
          <button 
            onClick={() => setShowReportReasons(!showReportReasons)} 
            className={`p-2 rounded-full transition-all backdrop-blur-md border border-white/10 ${showReportReasons ? 'bg-red-600 text-white' : 'bg-gray-950/40 text-gray-300 hover:bg-red-600'}`}
          >
            {showReportReasons ? <X size={14} /> : <Flag size={14} />}
          </button>
        )}
      </div>

      {/* 🎯 REPORT REASONS OVERLAY */}
      {showReportReasons && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200">
          <p className="text-white font-bold mb-3 text-sm">Why are you reporting this?</p>
          <div className="grid grid-cols-1 gap-2 w-full max-w-[180px]">
            {["Inappropriate Content", "Spam", "Harassment", "Fake Profile"].map((reason) => (
              <button
                key={reason}
                disabled={isReporting}
                onClick={() => handleReportAction(reason)}
                className="text-[11px] py-2 px-3 bg-gray-800 hover:bg-red-600 text-white rounded-lg transition-colors border border-gray-700 flex items-center justify-center"
              >
                {isReporting ? <Loader2 size={12} className="animate-spin" /> : reason}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1. Image Header */}
      <div className="relative aspect-square w-full bg-gray-800 m-0 p-0 overflow-hidden shrink-0">
        <Image src={post.image} alt={post.name} fill className="object-cover block transition-transform duration-500 group-hover:scale-110" unoptimized />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent p-3">
          <h3 className="text-sm sm:text-lg font-bold text-white truncate leading-tight">{post.name}, {post.age}</h3>
          <p className="text-[10px] sm:text-xs text-gray-300 truncate tracking-wide">{post.city}</p>
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="p-3 pt-2 sm:p-4 sm:pt-3 flex flex-col flex-1 justify-between space-y-2.5">
        <p className="text-gray-300 text-[11px] sm:text-sm leading-snug line-clamp-2">{post.context}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/40 mt-auto">
          <div className="flex gap-2 sm:gap-4">
            <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-1 group/btn bg-transparent border-none outline-none">
              <div className="p-1 rounded-full bg-green-500/10 text-green-500 group-hover/btn:bg-green-500 transition-colors">
                <CheckCircle2 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-green-500">{post.greenFlags}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-1 group/btn bg-transparent border-none outline-none">
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