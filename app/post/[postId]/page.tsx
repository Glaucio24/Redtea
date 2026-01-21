"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as Id<"posts">;
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const post = useQuery(api.posts.getPostById, { postId });
  const comments = useQuery(api.comments.getCommentsByPost, { postId });
  const addComment = useMutation(api.comments.addComment);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({ postId, content: commentText });
      setCommentText("");
      toast.success("Reply posted!");
    } catch (err) {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (post === undefined || comments === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent text-white text-xl font-bold">
        Post not found
      </div>
    );
  }

  return (
    /* 🎯 bg-transparent to match the rest of your app */
    <div className="min-h-screen bg-transparent p-3 sm:p-4 lg:p-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
        
        {/* Left Side: Original Post */}
        <div className="md:sticky md:top-10 w-full max-w-[400px] mx-auto md:mx-0">
          <PostCard 
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
              replies: comments.length,
              timestamp: new Date(post.createdAt).toLocaleDateString(),
            }}
          />
        </div>

        {/* Right Side: Discussion Section */}
        <div className="flex flex-col gap-5 sm:gap-6 mt-4 md:mt-0">
          <header className="px-1">
            {/* 🎯 Shrunk text for 360px mobile screens */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Discussion</h1>
            <p className="text-gray-400 text-[11px] sm:text-sm lg:text-base">Share your feedback anonymously</p>
          </header>
          
          <form onSubmit={handleSubmitComment} className="relative group">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a reply..."
              /* 🎯 Adjusted padding and font for mobile */
              className="w-full bg-gray-950 border border-gray-800 text-white p-3 sm:p-4 rounded-2xl min-h-[100px] sm:min-h-[120px] focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none text-xs sm:text-sm resize-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="absolute bottom-3 right-3 p-2 sm:p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-white px-1">
              Replies <span className="text-red-600">({comments.length})</span>
            </h2>
            
            {comments.map((c) => (
              <div key={c._id} className="bg-gray-900/30 border border-gray-800/40 p-4 sm:p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  {/* 🎯 Extra small text for narrow phones */}
                  <span className="text-red-500 font-bold text-[10px] sm:text-xs uppercase tracking-wider">{c.userPseudonym}</span>
                  <span className="text-gray-600 text-[9px] sm:text-[11px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-300 text-[11px] sm:text-sm leading-relaxed">{c.content}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-10 bg-gray-950 border border-dashed border-gray-800 rounded-2xl">
                <p className="text-gray-500 text-xs sm:text-sm">No replies yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}