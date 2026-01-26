"use client"

import { useState, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  User, MessageSquare, ThumbsUp, Flag, Loader2, 
  Trash2, ShieldAlert, Bell, CreditCard, Crown, 
  CheckCircle, Settings 
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { PostCard } from "@/components/post-card"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const profileId = resolvedParams.id
  const { user: clerkUser } = useUser()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"overview" | "notifications" | "subscription" | "settings">("overview")

  const userData = useQuery(api.users.getUserById, { userId: profileId as any })
  const currentUser = useQuery(api.users.readUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip")
  const stats = useQuery(api.users.getUserStats, userData ? { userId: userData._id } : "skip")
  const myPosts = useQuery(api.posts.getUserPosts, userData ? { userId: userData._id } : "skip")

  const rejectUser = useMutation(api.users.rejectAndSoftDeleteUser)

  if (userData === undefined || currentUser === undefined || stats === undefined || myPosts === undefined) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-black text-white p-4 text-center">
        <ShieldAlert className="text-red-600 mb-4" size={48} />
        <h1 className="text-xl font-bold text-white">User Not Found</h1>
        <Button onClick={() => router.back()} className="mt-6 bg-red-600 hover:bg-red-700 text-white">Go Back</Button>
      </div>
    )
  }

  const isAdmin = currentUser?.role === "admin"
  const isOwnProfile = currentUser?._id === userData._id

  const handleReject = async () => {
    await rejectUser({ userId: userData._id })
    router.push("/adminDashboard")
  }

  return (
    <div className="p-4 lg:p-8 pt-4 max-w-6xl mx-auto text-white bg-transparent">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            {isOwnProfile ? "My Profile" : `${userData.pseudonym}'s Profile`}
          </h1>
          <p className="text-gray-400 text-sm">
            {isOwnProfile ? "Manage your identity" : "View contributions"}
          </p>
        </div>

        {isAdmin && !isOwnProfile && (
           <AlertDialog>
           <AlertDialogTrigger asChild>
             <Button variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-full text-white">
               <Trash2 className="w-4 h-4 mr-2" /> Reject
             </Button>
           </AlertDialogTrigger>
           <AlertDialogContent className="bg-gray-950 border-gray-800 text-white rounded-3xl">
             <AlertDialogHeader>
               <AlertDialogTitle className="text-white">Confirm User Rejection</AlertDialogTitle>
               <AlertDialogDescription className="text-gray-400">
                 This will permanently delete this user and their data from the system.
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white rounded-full hover:bg-gray-700 hover:text-white">Cancel</AlertDialogCancel>
               <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700 rounded-full text-white">Confirm Purge</AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<User className="w-4 h-4 mr-2" />} label="Overview" />
        {isOwnProfile && (
          <>
            <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon={<Bell className="w-4 h-4 mr-2" />} label="Inbox" />
            <TabButton active={activeTab === "subscription"} onClick={() => setActiveTab("subscription")} icon={<CreditCard className="w-4 h-4 mr-2" />} label="Subscription" />
            <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings className="w-4 h-4 mr-2" />} label="Account" />
          </>
        )}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card className="bg-gray-950 border-gray-800 rounded-3xl overflow-hidden border-none shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-900/10 to-transparent border-b border-gray-800/40">
              <CardTitle className="text-white text-xs uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Identity Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex items-center gap-6">
              <div className="h-16 w-16 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20 shrink-0">
                <User className="text-red-500" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{userData.pseudonym}</h2>
                <p className="text-red-500 text-xs font-mono uppercase tracking-widest">{userData.role}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <StatCard icon={<MessageSquare className="text-blue-400" />} value={stats.postCount} label="Tea" color="bg-blue-600/20" />
            <StatCard icon={<ThumbsUp className="text-green-400" />} value={stats.greenFlags} label="Green" color="bg-green-600/20" />
            <StatCard icon={<Flag className="text-red-400" />} value={stats.redFlags} label="Red" color="bg-red-600/20" />
            <StatCard icon={<MessageSquare className="text-purple-400" />} value={0} label="Replies" color="bg-purple-600/20" />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold px-2 text-white">Contributions</h3>
            {myPosts.length === 0 ? (
              <div className="p-8 bg-gray-950 text-center text-gray-500 border border-dashed border-gray-800 rounded-3xl">
                No history.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      )}

      {/* Subscription Tab */}
      {activeTab === "subscription" && (
        <Card className="bg-gray-950 border-gray-800 rounded-3xl border-none shadow-2xl">
          <CardContent className="p-6">
             <div className="flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-bold text-sm text-white">Free Plan</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Standard Access</p>
                  </div>
                </div>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs h-8 rounded-full font-bold">
                  Upgrade
                </Button>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <Card className="bg-gray-950 border-red-900/50 border rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-red-500">Delete Account</p>
                <p className="text-[10px] text-gray-400">Permanently wipe your identity.</p>
              </div>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 rounded-full">
                Delete
              </Button>
            </div>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card className="bg-gray-950 border-gray-800 rounded-3xl border-none shadow-2xl p-10 text-center text-gray-500 text-xs uppercase tracking-widest">
          No new notifications.
        </Card>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "default" : "outline"}
      className={active 
        ? "bg-red-600 text-white rounded-full px-4 h-9 text-xs border-none" 
        : "border-gray-800 text-gray-400 bg-gray-950 rounded-full px-4 h-9 text-xs hover:text-white hover:bg-gray-900"}
    >
      {icon} {label}
    </Button>
  )
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode, value: number, label: string, color: string }) {
  return (
    <Card className="bg-gray-950 border-none shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 ${color} rounded-xl shrink-0`}>{icon}</div>
        <div>
          <p className="text-xl font-black leading-none text-white">{value}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 font-bold tracking-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}