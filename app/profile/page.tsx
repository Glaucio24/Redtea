"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, MessageSquare, ThumbsUp, Flag, Loader2 } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"

export default function ProfilePage() {
  const { user } = useUser()
  
  // fetch Real Data from your Convex backend
  const userData = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip")
  const stats = useQuery(api.users.getUserStats, userData ? { userId: userData._id } : "skip")

  // Loading State
  if (!userData || stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto text-white">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-400 text-sm lg:text-base">Your anonymous identity and community stats</p>
      </div>

      {/* Identity Card (Display Only) */}
      <Card className="bg-gray-900 border-gray-800 mb-6 lg:mb-8 rounded-3xl overflow-hidden shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-red-900/20 to-transparent border-b border-gray-800">
          <CardTitle className="text-white text-lg lg:text-xl font-semibold uppercase tracking-wider">
            Active Pseudonym
          </CardTitle>
          <p className="text-gray-400 text-sm">This is how you appear to others in the community</p>
        </CardHeader>
        <CardContent className="p-8 flex items-center gap-6">
            <div className="h-16 w-16 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20">
                <User className="text-red-500" size={32} />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                    {userData.pseudonym}
                </h2>
                <p className="text-red-500 text-xs font-mono uppercase mt-1">Verified Anonymous</p>
            </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <StatCard 
            icon={<MessageSquare className="text-blue-400" />} 
            value={stats.postCount} 
            label="Total Posts" 
            color="bg-blue-600/20" 
        />
        <StatCard 
            icon={<ThumbsUp className="text-green-400" />} 
            value={stats.greenFlags} 
            label="Green Flags" 
            color="bg-green-600/20" 
        />
        <StatCard 
            icon={<Flag className="text-red-400" />} 
            value={stats.redFlags} 
            label="Red Flags" 
            color="bg-red-600/20" 
        />
        <StatCard 
            icon={<MessageSquare className="text-purple-400" />} 
            value={0} 
            label="Replies" 
            color="bg-purple-600/20" 
        />
      </div>

      {/* Activity Section */}
      <Card className="bg-gray-900 border-gray-800 rounded-3xl border-dashed">
        <CardContent className="p-8 lg:p-12 text-center">
          {stats.postCount === 0 ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto flex items-center justify-center">
                <MessageSquare className="text-gray-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-white">Quiet so far...</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                You haven't spilled any tea yet. Your posts will show up here once you do.
              </p>
            </div>
          ) : (
             <div className="text-left">
                <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                <p className="text-gray-500 italic">Tracking {stats.postCount} anonymous contributions...</p>
                {/* Future: Map your real posts here */}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Reusable Stat Component
function StatCard({ icon, value, label, color }: { icon: React.ReactNode, value: number, label: string, color: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800 rounded-2xl overflow-hidden">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${color} rounded-xl`}>{icon}</div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}