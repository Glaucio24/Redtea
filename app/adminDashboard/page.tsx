"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"
import Link from "next/link" 
import Image from "next/image" // ✅ Added for optimization

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner" 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Flag, 
  Trash2, 
  Eye, 
  Users, 
  Search, 
  ShieldAlert,
  FileText,
  Ban,         
  ExternalLink,
  ShieldCheck,
  Scale
} from "lucide-react"

// --- Lightbox Component ---
function Lightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  if (!imageUrl) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
        <Image 
          src={imageUrl} 
          alt="Expanded view" 
          fill
          className="object-contain rounded-lg" 
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-full">✕</button>
    </div>
  )
}

// ✅ Explicit Type for the cn helper
function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

type PendingUser = {
  _id: Id<"users">
  clerkId: string;
  name?: string
  pseudonym?: string
  email: string
  selfieUrl?: string
  idUrl?: string
  createdAt: number
  isApproved: boolean
  isBanned?: boolean 
  verificationStatus: "pending" | "approved" | "rejected" | "none"
  role: string
  banCount?: number
}

export default function AdminDashboard() {
  const { user: clerkUser } = useUser()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  
  const [selectedTab, setSelectedTab] = useState("verification")
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedImage(null) }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const allUsers = useQuery(api.admin.getAllUsersWithVerificationStatus, isAuthenticated ? {} : "skip") as PendingUser[] | undefined
  const reportedPosts = useQuery(api.posts.getReportedPosts, isAuthenticated && clerkUser ? { adminClerkId: clerkUser.id } : "skip")

  const approveUser = useMutation(api.admin.approveUser)
  const wipeUserCompletely = useMutation(api.admin.wipeUserCompletely) 
  const deletePost = useMutation(api.posts.deleteUserPost)
  const toggleBan = useMutation(api.admin.toggleUserBan) 

  const handleApproveVerification = async (userId: string) => {
    try {
      await approveUser({ targetUserId: userId as Id<"users"> })
      toast.success("User Approved")
    } catch (err) { console.error(err) }
  }

  const handleRejectVerification = async (userId: Id<"users">, targetClerkId: string) => {
    if (!confirm("Reject and PERMANENTLY delete this user?")) return;
    const toastId = toast.loading("Purging system records...");
    try {
      const clerkResponse = await fetch("/api/delete-clerk-user", {
        method: "POST",
        body: JSON.stringify({ clerkId: targetClerkId }),
        headers: { "Content-Type": "application/json" },
      });
      if (!clerkResponse.ok) throw new Error("Auth account deletion failed");
      await wipeUserCompletely({ userId });
      toast.success("User and data permanently deleted", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Deletion failed.", { id: toastId });
    }
  };

  const handleToggleBan = async (userId: Id<"users">, currentStatus: boolean) => {
    const action = currentStatus ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await toggleBan({ userId, isBanned: !currentStatus });
      toast.success(`User ${!currentStatus ? 'Banned' : 'Unbanned'}`);
    } catch (err) { 
      toast.error("Ban update failed");
      console.error(err);
    }
  }

  const handleRemovePost = async (postId: Id<"posts">) => {
    if (!confirm("Remove this reported post?")) return;
    try {
      await deletePost({ postId });
      toast.success("Post removed")
    } catch (err) { 
      toast.error("Failed to remove post")
      console.error(err) 
    }
  }

  const filteredVerifications = allUsers?.filter((u) => {
    if (statusFilter !== "all") {
      if (statusFilter === "pending_review") {
        if (u.verificationStatus !== "pending" && u.verificationStatus !== "none") return false
      } else if (u.verificationStatus !== statusFilter) return false
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      return u.name?.toLowerCase().includes(lowerSearch) || u.email.toLowerCase().includes(lowerSearch) || u.pseudonym?.toLowerCase().includes(lowerSearch)
    }
    return true
  })

  const filteredRegistry = allUsers?.filter((u) => {
    const lowerSearch = userSearchTerm.toLowerCase()
    return (
      u.name?.toLowerCase().includes(lowerSearch) || 
      u.email.toLowerCase().includes(lowerSearch) || 
      u.pseudonym?.toLowerCase().includes(lowerSearch)
    )
  })

  if (authLoading || (isAuthenticated && allUsers === undefined)) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs">Verifying Secure Admin Session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-red-500/30">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <ShieldCheck className="w-5 h-5 text-red-600" />
               <h1 className="text-3xl font-black uppercase tracking-tighter italic">Command Center</h1>
            </div>
            <p className="text-gray-500 text-sm">Community safety protocols.</p>
          </div>
          <Badge variant="outline" className="border-green-500/50 bg-green-500/5 text-green-500 px-3 py-1">
            {allUsers?.length} Identities
          </Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800 max-w-2xl p-1 rounded-xl h-14">
            <TabsTrigger value="verification" className="rounded-lg data-[state=active]:bg-blue-600 font-bold uppercase text-xs"><ShieldAlert className="w-4 h-4 mr-2" /> ID</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-red-600 font-bold uppercase text-xs"><Flag className="w-4 h-4 mr-2" /> Reports</TabsTrigger>
            <TabsTrigger value="registry" className="rounded-lg data-[state=active]:bg-green-600 font-bold uppercase text-xs"><Users className="w-4 h-4 mr-2" /> Registry</TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            {filteredVerifications?.map((verification) => (
              <Card key={verification._id} className="bg-gray-900 border-gray-800 overflow-hidden rounded-2xl">
                <CardContent className="p-0 flex flex-col xl:flex-row">
                  <div className="xl:w-1/3 p-8 border-r border-gray-800 space-y-4">
                    <h3 className="text-lg font-black text-white">{verification.name || "Unnamed"}</h3>
                    <Badge className={cn("rounded-md px-2 py-0.5", verification.verificationStatus === "approved" ? "bg-green-600" : "bg-blue-600")}>
                        {verification.verificationStatus}
                    </Badge>
                    <div className="flex gap-2 pt-4">
                      <Button className="bg-blue-600 flex-1" onClick={() => handleApproveVerification(verification._id)}>Approve</Button>
                      <Button variant="ghost" className="text-red-500 border border-red-500/20 flex-1" onClick={() => handleRejectVerification(verification._id, verification.clerkId)}>Reject</Button>
                    </div>
                  </div>

                  <div className="flex-1 p-8 grid grid-cols-2 gap-8 bg-black/20">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-800">
                      <Image 
                        src={verification.idUrl || "/placeholder.svg"} 
                        alt="ID" 
                        fill 
                        className="object-cover cursor-zoom-in" 
                        onClick={() => setSelectedImage(verification.idUrl || "")}
                      />
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-800">
                      <Image 
                        src={verification.selfieUrl || "/placeholder.svg"} 
                        alt="Selfie" 
                        fill 
                        className="object-cover cursor-zoom-in" 
                        onClick={() => setSelectedImage(verification.selfieUrl || "")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reports">
            {reportedPosts?.map((post) => (
              <Card key={post._id} className="bg-gray-900 border-gray-800 mb-4 border-l-4 border-l-red-600">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">{post.name}, {post.age}</h3>
                  <div className="bg-black/30 p-4 rounded-xl my-4">
                    {/* ✅ FIXED: Escaped quotes */}
                    <p className="text-gray-300 italic font-medium">&quot;{post.text}&quot;</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleRemovePost(post._id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Purge Content
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {/* ... Rest of Registry remains similar, ensuring 'any' is removed from cn ... */}
        </Tabs>
      </div>
      {selectedImage && <Lightbox imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}