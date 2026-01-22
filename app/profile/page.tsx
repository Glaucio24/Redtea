"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, MessageSquare, ThumbsUp, Flag, Loader2 } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { PostCard } from "@/components/post-card"

export default function ProfilePage() {
  const { user } = useUser()
  
  const userData = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip")
  const stats = useQuery(api.users.getUserStats, userData ? { userId: userData._id } : "skip")
  const myPosts = useQuery(api.posts.getUserPosts, userData ? { userId: userData._id } : "skip")

  if (!userData || stats === undefined || !myPosts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 lg:p-8 max-w-6xl mx-auto text-white bg-transparent">
      <div className="mb-6 lg:mb-8 px-2">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">My Profile</h1>
        <p className="text-gray-400 text-xs sm:text-sm">Your anonymous identity and community stats</p>
      </div>

      <Card className="bg-gray-950 border-gray-800 mb-6 lg:mb-8 rounded-3xl overflow-hidden shadow-2xl border-none">
        <CardHeader className="bg-gradient-to-r from-red-900/20 to-transparent border-b border-gray-800/40 p-4 sm:p-6">
          <CardTitle className="text-white text-base lg:text-xl font-semibold uppercase tracking-wider">Active Pseudonym</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="shrink-0 h-16 w-16 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20">
                <User className="text-red-500" size={32} />
            </div>
            <div className="text-center sm:text-left min-w-0 w-full">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all sm:break-normal">
                    {userData.pseudonym}
                </h2>
                <p className="text-red-500 text-[10px] sm:text-xs font-mono uppercase mt-1 tracking-widest">Verified Anonymous Name</p>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-8">
        <StatCard icon={<MessageSquare size={18} />} value={stats.postCount} label="My Posts" color="bg-blue-600/50" />
        <StatCard icon={<ThumbsUp size={18} />} value={stats.greenFlags} label="Green Given" color="bg-green-600/50" />
        <StatCard icon={<Flag size={18} />} value={stats.redFlags} label="Red Given" color="bg-red-600/50" />
        <StatCard icon={<MessageSquare size={18} />} value={0} label="Replies" color="bg-purple-600/50" />
      </div>

      <div className="space-y-4">
        <div className="px-2">
            <h3 className="text-lg sm:text-xl font-bold">My Contributions</h3>
        </div>

        {myPosts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-3xl">No posts yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {myPosts.map((post) => (
              <PostCard 
                key={post._id} 
                isProfileView={true} // Only show delete button here
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
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode, value: number, label: string, color: string }) {
  return (
    <Card className="bg-gray-900/50 border-gray-800 rounded-2xl border-none shadow-lg">
      <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${color} rounded-xl`}>{icon}</div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}