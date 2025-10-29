'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
// 💡 Ensure Button is imported from your shadcn UI path:
import { Button } from '@/components/ui/button'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WaitingApprovalPage() {
  const { user } = useUser();
  const router = useRouter();
  const [statusText, setStatusText] = useState('Waiting for approval...');

  // Fetch user info from Convex in real-time
  const userInfo = useQuery(api.users.readUser, user ? { clerkId: user.id } : 'skip');
  
  // State to track if the account has been denied/deleted
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    // Wait until the query has finished loading
    if (userInfo === undefined) {
        setStatusText('Loading account status...');
        return;
    }
    
    // 🛑 HANDLED DENIAL/DELETION: If the record is null, the admin deleted it.
    if (userInfo === null) {
      setIsDenied(true);
      setStatusText('❌ Your profile was denied and your application has been removed. Please contact support or try signing up again.');
      return;
    }

    // HANDLED APPROVAL
    if (userInfo.isApproved) {
      setStatusText('✅ Approved! Redirecting to the main app...');
      // Redirect to the root page (app/page.tsx) where the experiment begins
      setTimeout(() => router.push('/'), 1500); 
    } else {
      // STILL PENDING
      setStatusText('⏳ Your profile is currently under review by our admin team.');
    }
    
  }, [userInfo, router]);
  
  // If the user hasn't loaded (e.g., Clerk not ready), display a basic loading state
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Review Status</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {isDenied ? (
                <XCircle className="w-12 h-12 text-red-600" />
            ) : (
                <Loader2 className={`w-12 h-12 animate-spin ${userInfo?.isApproved ? 'text-green-600' : 'text-blue-600'}`} />
            )}
          </div>

          <p className={`text-lg font-medium ${isDenied ? 'text-red-700' : 'text-gray-700'}`}>{statusText}</p>

          {!isDenied && (
            <p className="text-sm text-gray-500">
              Your status updates in real-time. Please keep this page open or check back soon.
            </p>
          )}
          
          {/* Button is correctly imported and used here: */}
          {isDenied && (
             <Button onClick={() => router.push('/sign-up')} className="mt-4">
                Go to Sign Up
             </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}