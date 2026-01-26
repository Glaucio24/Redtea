"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, MessageSquare, ThumbsUp, Flag, Loader2, Trash2, ShieldAlert } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { PostCard } from "@/components/post-card"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Unwrap the dynamic ID from the URL
  const resolvedParams = use(params)
  const profileId = resolvedParams.id

  const { user: clerkUser } = useUser()
  const router = useRouter()

  // 2. Fetch Data
  // We fetch the profile being viewed based on the ID in the URL
  const userData = useQuery(api.users.getUserById, { userId: profileId as any })
  
  // We fetch the LOGGED IN user to check if they are an admin
  const currentUser = useQuery(api.users.readUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip")
  
  const stats = useQuery(api.users.getUserStats, userData ? { userId: userData._id } : "skip")
  const myPosts = useQuery(api.posts.getUserPosts, userData ? { userId: userData._id } : "skip")

  // Admin Mutation
  const rejectUser = useMutation(api.users.rejectAndSoftDeleteUser)

  // 3. Loading State
  if (userData === undefined || currentUser === undefined || stats === undefined || myPosts === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  // 4. Error State (User not found)
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <ShieldAlert className="text-red-600 mb-4" size={48} />
        <h1 className="text-xl font-bold">User Not Found</h1>
        <p className="text-gray-500 text-center max-w-xs mt-2">
          This profile may have been deleted or the link is incorrect.
        </p>
        <Button onClick={() => router.back()} className="mt-6 bg-red-600 hover:bg-red-700">
          Go Back
        </Button>
      </div>
    )
  }

  const isAdmin = currentUser?.role === "admin"
  const isOwnProfile = currentUser?._id === userData._id

  const handleReject = async () => {
    if (confirm("Are you sure? This will reject and permanently delete this user.")) {
      await rejectUser({ userId: userData._id })
      router.push("/adminDashboard")
    }
  }

  return (
    <div className="p-2 sm:p-4 lg:p-8 max-w-6xl mx-auto text-white bg-transparent">
      <div className="mb-6 lg:mb-8 px-2 flex justify-between items-end">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold mb-1">
            {isOwnProfile ? "My Profile" : "User Profile"}
          </h1>
          <p className="text-gray-400 text-[10px] sm:text-sm">
            {isOwnProfile ? "Your anonymous identity and community stats" : "Anonymous community identity and contribution history"}
          </p>
        </div>

        {/* Admin Reject Button */}
        {isAdmin && !isOwnProfile && (
          <Button 
            variant="destructive" 
            onClick={handleReject}
            className="rounded-full px-6 bg-red-600 hover:bg-red-700 font-bold uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reject & Delete
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card className="bg-gray-950 border-gray-800 mb-6 lg:mb-8 rounded-3xl overflow-hidden shadow-2xl border-none">
        <CardHeader className="bg-gradient-to-r from-red-900/20 to-transparent border-b border-gray-800/40 p-4 sm:p-6">
          <CardTitle className="text-white text-xs sm:text-base lg:text-xl font-semibold uppercase tracking-wider">
            Active Pseudonym
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="shrink-0 h-16 w-16 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20">
            <User className="text-red-500" size={32} />
          </div>
          <div className="text-center sm:text-left min-w-0 w-full">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight break-all sm:break-normal">
              {userData.pseudonym}
            </h2>
            <p className="text-red-500 text-[10px] sm:text-xs font-mono uppercase mt-1 tracking-widest">
              {userData.role === "admin" ? "Community Administrator" : "Verified Anonymous Name"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-8">
        <StatCard icon={<MessageSquare size={18} />} value={stats.postCount} label="Tea Spilled" color="bg-blue-600/50" />
        <StatCard icon={<ThumbsUp size={18} />} value={stats.greenFlags} label="Green Given" color="bg-green-600/50" />
        <StatCard icon={<Flag size={18} />} value={stats.redFlags} label="Red Given" color="bg-red-600/50" />
        <StatCard icon={<MessageSquare size={18} />} value={0} label="Replies" color="bg-purple-600/50" />
      </div>

      {/* Contribution Feed */}
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-base sm:text-xl font-bold">
            {isOwnProfile ? "My Contributions" : "User Contributions"}
          </h3>
        </div>

        {myPosts.length === 0 ? (
          <div className="p-8 bg-gray-950 text-center text-gray-500 border border-dashed border-gray-800 rounded-3xl">
            No posts yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {myPosts.map((post) => (
              <PostCard 
                key={post._id}
                isProfileView={true} 
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
    <Card className="bg-gray-950 border-gray-800 rounded-2xl border-none shadow-lg">
      <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${color} rounded-xl shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-base sm:text-xl font-bold text-white leading-none">{value}</p>
          <p className="text-[8px] sm:text-xs text-gray-500 uppercase mt-1 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}