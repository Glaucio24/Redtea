'use client';

import { useEffect, useState } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, XCircle, Clock, CheckCircle2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WaitingApprovalPage() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  
  // Fetch user info from Convex in real-time
  const userInfo = useQuery(api.users.readUser, user ? { clerkId: user.id } : 'skip');
  
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    // Wait until the query has finished loading
    if (userInfo === undefined) return;
    
    // 🛑 DENIED: Record deleted or marked as rejected
    if (userInfo === null) {
      setIsDenied(true);
      return;
    }

    // ✅ APPROVED
    if (userInfo.isApproved) {
      // Small delay so they see the success state
      setTimeout(() => router.push('/dashboard'), 1500); 
    }
  }, [userInfo, router]);

  // Loading Clerk or Initial DB Fetch
  if (!clerkLoaded || userInfo === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-900/10 blur-[100px] rounded-full" />

      <Card className="w-full max-w-md text-center bg-gray-900 border-gray-800 shadow-2xl relative z-10 rounded-3xl p-4">
        <CardHeader>
          <div className="flex justify-center mb-4">
             <img src="/redtea.png" alt="RedTea" className="h-16 w-16 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isDenied ? 'Application Declined' : 'Account Under Review'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {isDenied ? (
              <XCircle className="w-16 h-16 text-red-500" />
            ) : userInfo?.isApproved ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
            ) : (
              <div className="relative">
                <Clock className="w-16 h-16 text-red-500/50" />
                <Loader2 className="w-16 h-16 animate-spin text-red-500 absolute top-0 left-0" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className={`text-lg font-medium ${isDenied ? 'text-red-400' : 'text-gray-200'}`}>
              {isDenied 
                ? 'Your profile was not approved for the community.' 
                : userInfo?.isApproved 
                ? 'Verification successful! Entrance granted.'
                : 'Your identity is being verified by our team.'}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isDenied 
                ? 'Your data has been removed for privacy. You may attempt to sign up again with valid identification.' 
                : 'This usually takes less than 24 hours. We will update this screen automatically.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {isDenied ? (
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 rounded-xl"
              >
                Back to Home
              </Button>
            ) : (
              <SignOutButton>
                <Button variant="ghost" className="text-gray-500 hover:text-white flex gap-2 mx-auto">
                  <LogOut className="w-4 h-4" />
                  Cancel & Sign Out
                </Button>
              </SignOutButton>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}