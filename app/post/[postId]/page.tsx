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
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white text-xl font-bold">
        Post not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 lg:p-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Original Post */}
        <div className="md:sticky md:top-10">
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
        <div className="flex flex-col gap-6">
          <header>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Discussion</h1>
            <p className="text-gray-400 text-sm lg:text-base">Join the conversation and share your feedback</p>
          </header>
          
          <form onSubmit={handleSubmitComment} className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-gray-900/50 border border-gray-800 text-white p-4 rounded-2xl min-h-[120px] focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none text-sm resize-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="absolute bottom-4 right-4 p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white px-1">
              Replies <span className="text-red-600">({comments.length})</span>
            </h2>
            
            {comments.map((c) => (
              <div key={c._id} className="bg-gray-900/30 border border-gray-800/40 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-red-500 font-bold text-xs uppercase tracking-wider">{c.userPseudonym}</span>
                  <span className="text-gray-600 text-[11px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}