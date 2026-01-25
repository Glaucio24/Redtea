"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"
import Link from "next/link" // 🎯 Added for viewing posts

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
  Ban,         // 🎯 Added
  ExternalLink // 🎯 Added
} from "lucide-react"

// --- Lightbox Component ---
function Lightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  if (!imageUrl) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <img src={imageUrl} alt="Expanded view" className="max-w-full max-h-full rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-full">✕</button>
    </div>
  )
}

type PendingUser = {
  _id: Id<"users">
  name?: string
  pseudonym?: string
  email: string
  selfieUrl?: string
  idUrl?: string
  createdAt: number
  isApproved: boolean
  isBanned?: boolean // 🎯 Added to type
  verificationStatus: "pending" | "approved" | "rejected" | "none"
  role: string
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

  // --- QUERIES ---
  const allUsers = useQuery(api.admin.getAllUsersWithVerificationStatus, isAuthenticated ? {} : "skip") as PendingUser[] | undefined
  const reportedPosts = useQuery(api.posts.getReportedPosts, isAuthenticated && clerkUser ? { adminClerkId: clerkUser.id } : "skip")

  // --- MUTATIONS ---
  const approveUser = useMutation(api.admin.approveUser)
  const wipeUserCompletely = useMutation(api.admin.wipeUserCompletely) // 🎯 Renamed from denyUser to match your backend
  const deletePost = useMutation(api.posts.deleteUserPost)
  const toggleBan = useMutation(api.admin.toggleUserBan) // 🎯 Added

  const handleApproveVerification = async (userId: string) => {
    try {
      await approveUser({ targetUserId: userId as Id<"users"> })
      toast.success("User Approved")
    } catch (err) { console.error(err) }
  }

  const handleRejectVerification = async (userId: string) => {
    if (!confirm("Reject and PERMANENTLY delete this user and all their data?")) return;
    try {
      // 🎯 Using the wipe mutation to fulfill your "auto-delete once rejected" requirement
      await wipeUserCompletely({ userId: userId as Id<"users"> })
      toast.success("User and data deleted")
    } catch (err) { 
      toast.error("Failed to delete user")
      console.error(err) 
    }
  }

  const handleToggleBan = async (userId: Id<"users">, currentStatus: boolean) => {
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
      toast.success("Post Removed")
    } catch (err) { 
      toast.error("Failed to remove post")
      console.error(err) 
    }
  }

  // --- FILTERING LOGIC ---
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mr-3" />
        <p>Verifying Admin Session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage users, verifications, and safety.</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="border-green-500 text-green-500">
               {allUsers?.length} Total Users
             </Badge>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 max-w-2xl p-1">
            <TabsTrigger value="verification" className="data-[state=active]:bg-blue-600">
              <ShieldAlert className="w-4 h-4 mr-2" /> Verification
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-red-600">
              <Flag className="w-4 h-4 mr-2" /> Reports {reportedPosts && reportedPosts.length > 0 && `(${reportedPosts.length})`}
            </TabsTrigger>
            <TabsTrigger value="registry" className="data-[state=active]:bg-green-600">
              <Users className="w-4 h-4 mr-2" /> User Registry
            </TabsTrigger>
          </TabsList>

          {/* --- VERIFICATION TAB --- */}
          <TabsContent value="verification" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input placeholder="Search by name, email, or pseudonym..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-800 border-gray-700 pl-10 text-white" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredVerifications?.map((verification) => (
                <Card key={verification._id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-white">
                            {verification.name || "Unnamed User"} 
                            <span className="text-gray-500 font-normal ml-2">(@{verification.pseudonym})</span>
                          </h3>
                          <Badge className={verification.verificationStatus === "approved" ? "bg-green-600" : verification.verificationStatus === "rejected" ? "bg-red-600" : "bg-blue-600"}>
                            {verification.verificationStatus}
                          </Badge>
                          <p className="text-sm text-gray-400">{verification.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">ID Document</h4>
                          <div className="relative group">
                            <img
                              src={verification.idUrl || "/placeholder.svg"}
                              alt="ID Document"
                              className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer group-hover:opacity-75 transition-all"
                              onClick={() => setSelectedImage(verification.idUrl || "")}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <Eye className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">Selfie Photo</h4>
                          <div className="relative group">
                            <img
                              src={verification.selfieUrl || "/placeholder.svg"}
                              alt="Selfie Photo"
                              className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer group-hover:opacity-75 transition-all"
                              onClick={() => setSelectedImage(verification.selfieUrl || "")}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <Eye className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                        <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleApproveVerification(verification._id)} disabled={verification.verificationStatus === "approved"}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => handleRejectVerification(verification._id)}>
                          <XCircle className="w-4 h-4 mr-2" /> Reject & Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* --- REPORTS TAB --- */}
          <TabsContent value="reports" className="space-y-6 outline-none">
             <div className="grid grid-cols-1 gap-4">
               {reportedPosts?.map((post) => (
                 <Card key={post._id} className="bg-gray-800 border-gray-700 text-white overflow-hidden">
                   <CardContent className="p-0 flex flex-col md:flex-row">
                      {post.imageUrl && (
                        <div className="relative w-full md:w-48 h-48 shrink-0">
                           <img src={post.imageUrl} className="w-full h-full object-cover" alt="Post content" />
                        </div>
                      )}
                      <div className="p-6 flex-1 space-y-3">
                        <div className="flex justify-between items-start">
                           <div>
                             <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/20 mb-2 border-red-500/30">REPORTED CONTENT</Badge>
                             <h3 className="text-xl font-bold">{post.name}, {post.age} • {post.city}</h3>
                             <p className="text-xs text-gray-400">Posted by: <span className="text-green-400">{post.creatorName}</span></p>
                           </div>
                           <span className="text-xs text-gray-500">{new Date(post._creationTime).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 italic text-sm">"{post.text}"</p>
                        <div className="flex gap-4 text-xs font-semibold text-gray-400">
                           <span className="text-green-500">{post.greenFlags} Green Flags</span>
                           <span className="text-red-500">{post.redFlags} Red Flags</span>
                           <span className="text-orange-400 font-bold underline">{post.reportCount || 1} Reports</span>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                           {/* 🎯 Added View Post Button */}
                           <Button variant="outline" size="sm" asChild className="bg-transparent border-gray-600 hover:bg-gray-700">
                             <Link href={`/posts/${post._id}`} target="_blank">
                               <ExternalLink className="w-4 h-4 mr-2" /> View Post
                             </Link>
                           </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleRemovePost(post._id)}><Trash2 className="w-4 h-4 mr-2" /> Remove Post</Button>
                        </div>
                      </div>
                   </CardContent>
                 </Card>
               ))}
               {reportedPosts?.length === 0 && (
                 <div className="text-center py-20 bg-gray-800 rounded-lg border border-dashed border-gray-700">
                    <Flag className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No reported posts to review.</p>
                 </div>
               )}
             </div>
          </TabsContent>

          {/* --- USER REGISTRY (GOD VIEW) --- */}
          <TabsContent value="registry" className="space-y-6 outline-none">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                placeholder="Search the User Registry (Pseudonym, Real Name, or Email)..." 
                value={userSearchTerm} 
                onChange={(e) => setUserSearchTerm(e.target.value)} 
                className="bg-gray-800 border-gray-700 pl-10 text-white" 
              />
            </div>

            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Identity (Real ↔ Anon)</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredRegistry?.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{u.name}</span>
                            <span className="text-green-500 text-xs font-mono">@{u.pseudonym}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{u.email}</td>
                        <td className="px-6 py-4">
                          {/* 🎯 Added Ban Badge */}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {u.role}
                            </Badge>
                            {u.isBanned && (
                              <Badge variant="destructive" className="text-[10px] uppercase bg-red-600">
                                Banned
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* 🎯 Added Ban/Unban Toggle */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title={u.isBanned ? "Unban User" : "Ban User"}
                              className={u.isBanned ? "text-green-400 hover:bg-green-400/10" : "text-orange-400 hover:bg-orange-400/10"}
                              onClick={() => handleToggleBan(u._id, !!u.isBanned)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => handleRejectVerification(u._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedImage && <Lightbox imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}