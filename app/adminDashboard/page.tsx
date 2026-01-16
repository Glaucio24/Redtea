"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"

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
import { CheckCircle, XCircle, Loader2, Flag, Trash2, Eye } from "lucide-react"

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
  verificationStatus: "pending" | "approved" | "rejected" | "none"
}

export default function AdminDashboard() {
  const { user } = useUser()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  
  const [selectedTab, setSelectedTab] = useState("verification")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedImage(null) }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // --- QUERIES ---
  const users = useQuery(api.admin.getAllUsersWithVerificationStatus, isAuthenticated ? {} : "skip") as PendingUser[] | undefined
  const reportedPosts = useQuery(api.posts.getReportedPosts, isAuthenticated && user ? { adminClerkId: user.id } : "skip")

  // --- MUTATIONS ---
  const approveUser = useMutation(api.admin.approveUser)
  const denyUser = useMutation(api.admin.denyUser) 
  const deletePost = useMutation(api.posts.deletePost)

  const handleApproveVerification = async (userId: string) => {
    try {
      await approveUser({ targetUserId: userId as Id<"users"> })
      toast.success("User Approved")
    } catch (err) { console.error(err) }
  }

  const handleRejectVerification = async (userId: string) => {
    if (!confirm("Reject and PERMANENTLY delete this user and all their data?")) return;
    try {
      await denyUser({ targetUserId: userId as Id<"users"> })
      toast.success("User and data deleted")
    } catch (err) { console.error(err) }
  }

  const handleRemovePost = async (postId: Id<"posts">) => {
    if (!confirm("Remove this reported post?")) return;
    try {
      await deletePost({ adminClerkId: user!.id, postId })
      toast.success("Post Removed")
    } catch (err) { console.error(err) }
  }

  // --- FILTERING LOGIC ---
  const filteredUsers = users?.filter((u) => {
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

  if (authLoading || (isAuthenticated && users === undefined)) {
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
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 max-w-md p-1">
            <TabsTrigger value="verification" className="data-[state=active]:bg-green-600">User Verification</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-red-600">Reported Posts {reportedPosts && reportedPosts.length > 0 && `(${reportedPosts.length})`}</TabsTrigger>
          </TabsList>

          {/* --- TAB 1: USER VERIFICATION (RESTORING YOUR FULL CONTENT) --- */}
          <TabsContent value="verification" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input placeholder="Search verifications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Verifications</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredUsers?.map((verification) => (
                <Card key={verification._id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-white">
                            {verification.name || verification.pseudonym || "No Name Provided"}
                          </h3>
                          <Badge className={verification.verificationStatus === "approved" ? "bg-green-600" : verification.verificationStatus === "rejected" ? "bg-red-600" : "bg-blue-600"}>
                            {verification.verificationStatus === "approved" ? "Approved" : verification.verificationStatus === "rejected" ? "Rejected" : "Pending Review"}
                          </Badge>
                          <p className="text-sm text-gray-400">Email: {verification.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">ID Document</h4>
                          <img
                            src={verification.idUrl || "/placeholder.svg"}
                            alt="ID Document"
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                            onClick={() => setSelectedImage(verification.idUrl || "/placeholder.svg")}
                          />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">Selfie Photo</h4>
                          <img
                            src={verification.selfieUrl || "/placeholder.svg"}
                            alt="Selfie Photo"
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                            onClick={() => setSelectedImage(verification.selfieUrl || "/placeholder.svg")}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                        <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleApproveVerification(verification._id)} disabled={verification.verificationStatus === "approved"}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve Verification
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => handleRejectVerification(verification._id)}>
                          <XCircle className="w-4 h-4 mr-2" /> Reject & Delete User
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* --- TAB 2: REPORTED POSTS --- */}
          <TabsContent value="reports" className="space-y-6 outline-none">
             <div className="grid grid-cols-1 gap-4">
               {reportedPosts?.map((post) => (
                 <Card key={post._id} className="bg-gray-800 border-gray-700 text-white overflow-hidden">
                   <CardContent className="p-0 flex flex-col md:flex-row">
                      {post.imageUrl && (
                        <div className="relative w-full md:w-48 h-48 shrink-0">
                           <img src={post.imageUrl} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-6 flex-1 space-y-3">
                        <div className="flex justify-between items-start">
                           <div>
                              <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/20 mb-2 border-red-500/30">REPORTED CONTENT</Badge>
                              <h3 className="text-xl font-bold">{post.name}, {post.age} • {post.city}</h3>
                           </div>
                           <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 italic text-sm">"{post.text}"</p>
                        <div className="flex gap-4 text-xs font-semibold text-gray-400">
                           <span className="text-green-500">{post.greenFlags} Green Flags</span>
                           <span className="text-red-500">{post.redFlags} Red Flags</span>
                           <span className="text-orange-400">{post.reportCount || 1} Reports</span>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                           <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"><Eye className="w-4 h-4 mr-2" /> View Full</Button>
                           <Button variant="destructive" onClick={() => handleRemovePost(post._id)}><Trash2 className="w-4 h-4 mr-2" /> Remove Post</Button>
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
        </Tabs>
      </div>

      {selectedImage && <Lightbox imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}