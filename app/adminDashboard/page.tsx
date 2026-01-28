"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"
import Link from "next/link" 

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
      <img src={imageUrl} alt="Expanded view" className="max-w-full max-h-full rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-full">✕</button>
    </div>
  )
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

  // --- QUERIES ---
  const allUsers = useQuery(api.admin.getAllUsersWithVerificationStatus, isAuthenticated ? {} : "skip") as PendingUser[] | undefined
  const reportedPosts = useQuery(api.posts.getReportedPosts, isAuthenticated && clerkUser ? { adminClerkId: clerkUser.id } : "skip")

  // --- MUTATIONS ---
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

  // --- FIXED NUCLEAR OPTION ---
  const handleRejectVerification = async (userId: Id<"users">, targetClerkId: string) => {
    if (!confirm("Reject and PERMANENTLY delete this user from Database AND Authentication?")) return;

    const toastId = toast.loading("Purging system records...");

    try {
      // 1. Delete from Clerk (Auth) - Stops the auto-recreate loop
      const clerkResponse = await fetch("/api/delete-clerk-user", {
        method: "POST",
        body: JSON.stringify({ clerkId: targetClerkId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!clerkResponse.ok) throw new Error("Auth account deletion failed");

      // 2. Delete from Convex (Database)
      await wipeUserCompletely({ userId });

      toast.success("User and data permanently deleted", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Deletion failed. User may still exist.", { id: toastId });
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
    if (!confirm("Remove this reported post? This cannot be undone.")) return;
    try {
      await deletePost({ postId });
      toast.success("Post removed and media deleted")
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
            <p className="text-gray-500 text-sm">Community safety and identity verification protocols.</p>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase">System Status</p>
                <Badge variant="outline" className="border-green-500/50 bg-green-500/5 text-green-500 px-3 py-1">
                  {allUsers?.length} Active Identities
                </Badge>
             </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800 max-w-2xl p-1 rounded-xl h-14">
            <TabsTrigger value="verification" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold uppercase text-xs">
              <ShieldAlert className="w-4 h-4 mr-2" /> ID Verification
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all font-bold uppercase text-xs">
              <Flag className="w-4 h-4 mr-2" /> Reports {reportedPosts && reportedPosts.length > 0 && `(${reportedPosts.length})`}
            </TabsTrigger>
            <TabsTrigger value="registry" className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all font-bold uppercase text-xs">
              <Users className="w-4 h-4 mr-2" /> Registry
            </TabsTrigger>
          </TabsList>

          {/* --- VERIFICATION TAB --- */}
          <TabsContent value="verification" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input placeholder="Search identity..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-900 border-gray-800 pl-10 text-white focus:ring-blue-500/50 rounded-xl" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-900 border-gray-800 text-white rounded-xl"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredVerifications?.map((verification) => (
                <Card key={verification._id} className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden rounded-2xl group">
                  <CardContent className="p-0 flex flex-col xl:flex-row">
                    <div className="xl:w-1/3 p-8 border-b xl:border-b-0 xl:border-r border-gray-800 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold border border-blue-600/20">
                                {verification.name?.[0] || "?"}
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-white leading-none">
                                    {verification.name || "Unnamed"}
                                </h3>
                                <p className="text-blue-500 font-mono text-xs mt-1">@{verification.pseudonym}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 pt-2">
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                <FileText className="w-3 h-3" /> {verification.email}
                            </p>
                            <Badge className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                                verification.verificationStatus === "approved" ? "bg-green-600" : 
                                verification.verificationStatus === "rejected" ? "bg-red-600" : "bg-blue-600"
                            )}>
                                {verification.verificationStatus}
                            </Badge>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 h-10 font-bold text-xs uppercase" onClick={() => handleApproveVerification(verification._id)} disabled={verification.verificationStatus === "approved"}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </Button>
                            <Button variant="ghost" className="hover:bg-red-600/10 text-red-500 hover:text-red-400 flex-1 h-10 font-bold text-xs uppercase border border-red-500/20" onClick={() => handleRejectVerification(verification._id, verification.clerkId)}>
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID Document</h4>
                            <Eye className="w-3 h-3 text-gray-700" />
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-800 group/img">
                          <img
                            src={verification.idUrl || "/placeholder.svg"}
                            alt="ID Document"
                            className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover/img:scale-105"
                            onClick={() => setSelectedImage(verification.idUrl || "")}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Selfie</h4>
                            <Eye className="w-3 h-3 text-gray-700" />
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-800 group/img">
                          <img
                            src={verification.selfieUrl || "/placeholder.svg"}
                            alt="Selfie"
                            className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover/img:scale-105"
                            onClick={() => setSelectedImage(verification.selfieUrl || "")}
                          />
                        </div>
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
                 <Card key={post._id} className="bg-gray-900 border-gray-800 text-white overflow-hidden rounded-2xl group border-l-4 border-l-red-600">
                   <CardContent className="p-0 flex flex-col md:flex-row">
                      {post.imageUrl && (
                        <div className="relative w-full md:w-64 h-64 shrink-0 overflow-hidden border-r border-gray-800">
                           <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Evidence" />
                           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
                        </div>
                      )}
                      <div className="p-8 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-red-500 text-white border-none font-black text-[10px] uppercase tracking-tighter">Danger Area</Badge>
                                        <div className="flex items-center text-[10px] text-orange-500 font-bold uppercase gap-1">
                                            <ShieldAlert className="w-3 h-3" /> {post.reportCount || 1} Reported Violations
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">{post.name}, {post.age}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Author: <span className="text-blue-500 font-mono">@{post.creatorName}</span></p>
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{new Date(post._creationTime).toDateString()}</span>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl border border-gray-800/50 mb-6">
                                <p className="text-gray-300 italic text-sm leading-relaxed font-medium">"{post.text}"</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                            <div className="flex gap-4">
                                <Button variant="outline" size="sm" asChild className="bg-transparent border-gray-700 hover:bg-white hover:text-black transition-all rounded-lg h-10 px-4 font-bold uppercase text-[10px]">
                                    <Link href={`/post/${post._id}`}>
                                        <Eye className="w-4 h-4 mr-2" /> Inspect Post
                                    </Link>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRemovePost(post._id)} className="h-10 px-4 font-bold uppercase text-[10px] rounded-lg">
                                    <Trash2 className="w-4 h-4 mr-2" /> Purge Content
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <div className="text-center px-3 border-r border-gray-800">
                                    <p className="text-[10px] text-green-500 font-black">{post.greenFlags}</p>
                                    <p className="text-[8px] text-gray-500 uppercase">Green</p>
                                </div>
                                <div className="text-center px-3">
                                    <p className="text-[10px] text-red-500 font-black">{post.redFlags}</p>
                                    <p className="text-[8px] text-gray-500 uppercase">Red</p>
                                </div>
                            </div>
                        </div>
                      </div>
                   </CardContent>
                 </Card>
               ))}
               {reportedPosts?.length === 0 && (
                 <div className="text-center py-32 bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-800">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-800" />
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Clear Skies: No Active Reports</p>
                 </div>
               )}
             </div>
          </TabsContent>

          {/* --- USER REGISTRY --- */}
          <TabsContent value="registry" className="space-y-6 outline-none">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                placeholder="Global identity search..." 
                value={userSearchTerm} 
                onChange={(e) => setUserSearchTerm(e.target.value)} 
                className="bg-gray-900 border-gray-800 pl-12 h-14 text-white rounded-2xl focus:ring-green-500/50" 
              />
            </div>

            <Card className="bg-gray-900 border-gray-800 overflow-hidden rounded-2xl shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-gray-800 text-gray-500 text-[10px] uppercase font-black tracking-widest">
                      <th className="px-8 py-5 font-medium">User Profile</th>
                      <th className="px-8 py-5 font-medium">Status & Safety</th>
                      <th className="px-8 py-5 font-medium text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {filteredRegistry?.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* COLUMN 1: Profile */}
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold border border-gray-700">
                                {u.name?.[0] || "U"}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-white font-bold tracking-tight">{u.name}</span>
                                <span className="text-green-500 text-[10px] font-mono">@{u.pseudonym}</span>
                                <span className="text-[10px] text-gray-500 mt-1">{u.email}</span>
                             </div>
                          </div>
                        </td>

                        {/* COLUMN 2: Status */}
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] uppercase font-black border-gray-700 text-gray-400">
                              {u.role}
                            </Badge>
                            {u.isBanned ? (
                              <Badge className="text-[9px] uppercase font-black bg-red-600 border-none">Banned</Badge>
                            ) : u.banCount && u.banCount > 0 ? (
                                <Badge className="text-[9px] uppercase font-black bg-orange-600 border-none animate-pulse">
                                    Probation Level {u.banCount}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] uppercase font-black border-green-500/50 text-green-500">Good Standing</Badge>
                            )}
                          </div>
                        </td>

                        {/* COLUMN 3: Actions */}
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild className="text-blue-400 hover:bg-blue-400/10 rounded-lg">
                              <Link href={`/profile/${u._id}`}><ExternalLink className="w-4 h-4" /></Link>
                            </Button>

                            {/* Safety Check: Only show Ban/Delete if user is NOT the current Admin */}
                            {clerkUser?.id !== u.clerkId ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={u.isBanned ? "text-green-400 hover:bg-green-400/10" : "text-orange-400 hover:bg-orange-400/10"}
                                  onClick={() => handleToggleBan(u._id, !!u.isBanned)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                                
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white hover:bg-gray-800">
                                  <Scale className="w-4 h-4" />
                                </Button>

                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:bg-red-500/10"
                                  onClick={() => handleRejectVerification(u._id, u.clerkId)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[9px] uppercase font-black border-gray-700 text-gray-500 px-3 py-1">
                                Active Session (You)
                              </Badge>
                            )}
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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}