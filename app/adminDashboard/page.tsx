"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"

import type { Id } from "@/convex/_generated/dataModel" 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, CheckCircle, XCircle, Eye, Users, Search } from "lucide-react"

// Define the type for the user data returned by your Convex query
type PendingUser = {
  _id: Id<"users">;
  name?: string;
  pseudonym?: string;
  email: string;
  selfieUrl?: string;
  idUrl?: string;
  createdAt: number;
  isApproved: boolean;
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  const [selectedTab, setSelectedTab] = useState("verification")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Only fetch if user is loaded
  const pendingUsers = useQuery(api.admin.getPendingUsers, user?.id ? { adminClerkId: user.id } : "skip")
  const approveUser = useMutation(api.admin.approveUser)
  const denyUser = useMutation(api.admin.denyUser)

const handleApproveVerification = async (userId: string) => {
  // Check if user exists (good practice)
  if (!user) {
    console.error("Error: Admin user not found.")
    return
  }

  try {
    await approveUser({
      adminClerkId: user.id,
      targetUserId: userId as Id<"users">
    })
    
    // ✅ Replaced alert with console.log for success
    console.log(`✅ Verification approved for user ID: ${userId}`) 

  } catch (err) {
    // ❌ Keeping console.error for the detailed error log
    console.error(err)
    
    // ❌ Replaced alert with console.error for failure notification
    console.error(`❌ Failed to approve verification for user ID: ${userId}`)
  }
}

// -------------------------------------------------------------

const handleRejectVerification = async (userId: string) => {
  // Check if user exists (good practice)
  if (!user) {
    console.error("Error: Admin user not found.")
    return
  }

  try {
    await denyUser({
      adminClerkId: user.id,
      targetUserId: userId as Id<"users">
    })
    
    // 🚫 Replaced alert with console.log for success
    console.log(`🚫 Verification rejected for user ID: ${userId}`) 

  } catch (err) {
    // ❌ Keeping console.error for the detailed error log
    console.error(err)
    
    // ❌ Replaced alert with console.error for failure notification
    console.error(`❌ Failed to reject verification for user ID: ${userId}`)
  }
}
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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
              {/* Type-safe mapping using the PendingUser type */}
              {(pendingUsers as PendingUser[] | undefined)?.map((verification) => (
                <Card key={verification._id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          {/* Display name or pseudonym */}
                          <h3 className="text-lg font-semibold text-white">{verification.name || verification.pseudonym || "No Name Provided"}</h3>
                          <Badge
                            variant={verification.isApproved ? "secondary" : "default"}
                            className={verification.isApproved ? "bg-green-600" : "bg-blue-600"}
                          >
                            {verification.isApproved ? "Approved" : "Pending Review"}
                          </Badge>
                          <p className="text-sm text-gray-400">
                            Email: {verification.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">ID Document</h4>
                          {/* Mapped to 'idUrl' */}
                          <img
                            src={verification.idUrl || "/placeholder.svg"}
                            alt="ID Document"
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                          />
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">Selfie Photo</h4>
                          {/* Mapped to 'selfieUrl' */}
                          <img
                            src={verification.selfieUrl || "/placeholder.svg"}
                            alt="Selfie Verification"
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                        <Button
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          onClick={() => handleApproveVerification(verification._id)}
                          disabled={verification.isApproved} 
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Verification
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleRejectVerification(verification._id)}
                          disabled={verification.isApproved} 
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Add a message if no users are pending review */}
              {pendingUsers && pendingUsers.length === 0 && (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">All clear! No users are currently pending review.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}