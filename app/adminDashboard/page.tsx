"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle } from "lucide-react"

// --- Lightbox Component ---
function Lightbox({
  imageUrl,
  onClose,
}: {
  imageUrl: string
  onClose: () => void
}) {
  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Expanded view"
        className="max-w-full max-h-full rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-full"
      >
        ✕
      </button>
    </div>
  )
}

// Define the type for the user data
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
  const { user, isLoaded } = useUser()
  const [selectedTab, setSelectedTab] = useState("verification")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // --- Add Esc key listener to close lightbox ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // FETCH: Get all users at once
  const users = useQuery(
    api.admin.getAllUsersWithVerificationStatus,
    user?.id
      ? {
          adminClerkId: user.id,
        }
      : "skip"
  ) as PendingUser[] | undefined

  const approveUser = useMutation(api.admin.approveUser)
  const denyUser = useMutation(api.admin.denyUser)

  const handleApproveVerification = async (userId: string) => {
    if (!user) return
    try {
      await approveUser({
        adminClerkId: user.id,
        targetUserId: userId as Id<"users">,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectVerification = async (userId: string) => {
    if (!user) return
    try {
      await denyUser({
        adminClerkId: user.id,
        targetUserId: userId as Id<"users">,
      })
    } catch (err) {
      console.error(err)
    }
  }

  // --- FILTERING LOGIC ---
  const filteredUsers = users?.filter((user) => {
    if (statusFilter !== "all") {
      const userStatus = user.verificationStatus
      if (statusFilter === "pending_review") {
        if (userStatus === "pending" || userStatus === "none") {
        } else {
          return false
        }
      } else if (userStatus !== statusFilter) {
        return false
      }
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      const nameMatch = user.name?.toLowerCase().includes(lowerSearch)
      const pseudonymMatch = user.pseudonym?.toLowerCase().includes(lowerSearch)
      const emailMatch = user.email.toLowerCase().includes(lowerSearch)
      return nameMatch || pseudonymMatch || emailMatch
    }

    return true
  })

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="verification" className="data-[state=active]:bg-green-600">
              User Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Input
                  placeholder="Search verifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
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
                            {verification.name ||
                              verification.pseudonym ||
                              "No Name Provided"}
                          </h3>
                          <Badge
                            variant={
                              verification.verificationStatus === "approved"
                                ? "secondary"
                                : "default"
                            }
                            className={
                              verification.verificationStatus === "approved"
                                ? "bg-green-600"
                                : verification.verificationStatus === "rejected"
                                ? "bg-red-600"
                                : "bg-blue-600"
                            }
                          >
                            {verification.verificationStatus === "approved"
                              ? "Approved"
                              : verification.verificationStatus === "rejected"
                              ? "Rejected"
                              : "Pending Review"}
                          </Badge>
                          <p className="text-sm text-gray-400">
                            Email: {verification.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            ID Document
                          </h4>
                          <img
                            src={verification.idUrl || "/placeholder.svg"}
                            alt="ID Document"
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                            onClick={() =>
                              setSelectedImage(verification.idUrl || "/placeholder.svg")
                            }
                          />
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            Selfie Photo
                          </h4>
                          <img
                            src={verification.selfieUrl || "/placeholder.svg"}
                            alt="Selfie Verification"
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                            onClick={() =>
                              setSelectedImage(
                                verification.selfieUrl || "/placeholder.svg"
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                        <Button
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          onClick={() => handleApproveVerification(verification._id)}
                          disabled={
                            verification.verificationStatus === "approved" ||
                            verification.verificationStatus === "rejected"
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Verification
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleRejectVerification(verification._id)}
                          disabled={
                            verification.verificationStatus === "approved" ||
                            verification.verificationStatus === "rejected"
                          }
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredUsers && filteredUsers.length === 0 && (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">
                    No users match your current search and filter criteria.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- LIGHTBOX --- */}
      {selectedImage && (
        <Lightbox imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  )
}
