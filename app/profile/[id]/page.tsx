"use client"

import { useState, use } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, MessageSquare, ThumbsUp, Flag, Loader2, 
  Trash2, ShieldAlert, Bell, CreditCard,
  Settings 
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser, useClerk } from "@clerk/nextjs"
import { PostCard } from "@/components/post-card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { Id } from "@/convex/_generated/dataModel"

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const profileId = resolvedParams.id
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk() 
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"overview" | "notifications" | "subscription" | "settings">("overview")

  const userData = useQuery(api.users.getUserById, { userId: profileId as Id<"users"> })
  const currentUser = useQuery(api.users.readUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip")
  const stats = useQuery(api.users.getUserStats, userData ? { userId: userData._id } : "skip")
  const myPosts = useQuery(api.posts.getUserPosts, userData ? { userId: userData._id } : "skip")

  const wipeUserCompletely = useMutation(api.admin.wipeUserCompletely)

  if (userData === undefined || currentUser === undefined || stats === undefined || myPosts === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 text-center">
        <ShieldAlert className="text-red-600 mb-4" size={48} />
        <h1 className="text-xl font-bold italic uppercase">Identity Purged</h1>
        <Button onClick={() => router.push("/")} className="mt-6 bg-red-600 rounded-full">Return Home</Button>
      </div>
    )
  }

  const isAdmin = currentUser?.role === "admin"
  const isOwnProfile = clerkUser?.id === userData.clerkId

  const handlePurge = async () => {
    const tid = toast.loading("Initiating permanent wipe sequence...");
    
    try {
      await wipeUserCompletely({ userId: userData._id });
      toast.loading("Database purged. Finalizing Auth removal...", { id: tid });

      const clerkResponse = await fetch("/api/delete-clerk-user", {
        method: "POST",
        body: JSON.stringify({ clerkId: userData.clerkId }),
        headers: { "Content-Type": "application/json" }
      });

      if (!clerkResponse.ok) {
        throw new Error("Convex wiped, but Clerk deletion failed.");
      }

      toast.success("Identity destroyed.", { id: tid });

      if (isOwnProfile) {
        await signOut();
        window.location.href = "/"; 
      } else {
        router.push("/adminDashboard");
      }
    } catch (err: unknown) { 
      console.error("Purge Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Wipe interrupted.";
      toast.error(errorMessage, { id: tid });
    }
  }

  return (
    <div className="p-4 lg:p-8 pt-4 max-w-6xl mx-auto text-white min-h-screen bg-transparent">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl lg:text-4xl font-black italic uppercase tracking-tighter mb-2">
            {isOwnProfile ? "My Identity" : `${userData.pseudonym}'s Profile`}
          </h1>
          <Badge className="bg-red-600/10 text-red-500 border-red-500/20 uppercase text-[10px] font-black tracking-widest px-3 py-1">
            {userData.role} record
          </Badge>
        </div>

        {isAdmin && !isOwnProfile && (
           <AlertDialog>
           <AlertDialogTrigger asChild>
             <Button variant="destructive" className="bg-red-600 rounded-full font-black uppercase text-[10px] px-8 h-10 shadow-lg shadow-red-600/20">
               <Trash2 className="w-4 h-4 mr-2" /> Purge User
             </Button>
           </AlertDialogTrigger>
           <AlertDialogContent className="bg-gray-950 border-gray-800 text-white rounded-3xl">
             <AlertDialogHeader>
               <AlertDialogTitle className="uppercase font-black text-red-500">Nuclear Option</AlertDialogTitle>
               <AlertDialogDescription className="text-gray-400 font-medium leading-relaxed">
                 This will permanently delete this user&apos;s login account and all associated posts, comments, and images. This action cannot be reversed.
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel className="bg-gray-800 text-white rounded-full border-none px-6">Abort</AlertDialogCancel>
               <AlertDialogAction onClick={handlePurge} className="bg-red-600 rounded-full font-bold px-6">Wipe User</AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
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
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <StatCard icon={<MessageSquare className="text-blue-400" />} value={stats.postCount} label="Tea Spilled" color="bg-blue-600/20" />
            <StatCard icon={<ThumbsUp className="text-green-400" />} value={stats.greenFlags} label="Green Given" color="bg-green-600/20" />
            <StatCard icon={<Flag className="text-red-400" />} value={stats.redFlags} label="Red Given" color="bg-red-600/20" />
            <StatCard icon={<MessageSquare className="text-purple-400" />} value={0} label="Replies" color="bg-purple-600/20" />
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Digital Footprint</h3>
            {myPosts.length === 0 ? (
              <div className="p-20 bg-gray-950/50 text-center text-gray-700 border border-dashed border-gray-800 rounded-3xl uppercase text-xs font-black tracking-widest">
                No contribution history found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      replies: 0,
                      timestamp: "", 
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <Card className="bg-gray-950 border-red-900/40 border-2 rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-2xl text-red-500 uppercase italic tracking-tighter mb-1">Self-Destruct Protocol</p>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Permanently wipe your identity and all digital traces.</p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="bg-red-600 text-white h-12 px-10 rounded-full font-black uppercase shadow-lg shadow-red-600/30">
                        Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-950 border-gray-800 text-white rounded-3xl">
                    <AlertDialogHeader>
                    <AlertDialogTitle className="uppercase font-black text-red-500">Confirm Self-Destruct?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400 font-medium">
                        Deleting your account will purge your login and permanently remove every post and comment you&apos;ve made. This cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-800 text-white rounded-full border-none px-6">Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePurge} className="bg-red-600 rounded-full font-bold px-6">Confirm Purge</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
        </Card>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button onClick={onClick} variant={active ? "default" : "outline"} className={active ? "bg-red-600 text-white rounded-full h-12 px-8 text-[10px] font-black uppercase shadow-lg shadow-red-600/20" : "border-gray-800 bg-gray-950 text-gray-500 rounded-full h-12 px-8 text-[10px] font-black uppercase transition-all hover:bg-gray-900"}>
      {icon} {label}
    </Button>
  )
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode, value: number, label: string, color: string }) {
  return (
    <Card className="bg-gray-950 border border-gray-800/50 rounded-3xl p-6 flex items-center gap-5 shadow-xl hover:border-gray-700 transition-all">
      <div className={`p-4 ${color} rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{value}</p>
        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-2">{label}</p>
      </div>
    </Card>
  )
}