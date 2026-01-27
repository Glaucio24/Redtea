"use client"

import { ShieldAlert, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClerk } from "@clerk/nextjs"

export function BannedScreen() {
  const { signOut } = useClerk()

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-950 border border-red-900/50 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/20">
          <ShieldAlert className="text-red-500 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Access Restricted</h1>
        <p className="text-gray-400 text-sm mb-8">
          Your account has been suspended for violating our community guidelines. 
          If you believe this is a mistake, contact support.
        </p>
        <Button 
          onClick={() => signOut()} 
          variant="outline" 
          className="w-full border-gray-800 text-gray-400 hover:text-white rounded-full h-12"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  )
}