"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar"; 
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn, isLoaded: clerkLoaded } = useUser();
  
  // Use user.id if available, otherwise skip
  const userInfo = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If Clerk hangs for more than 2 seconds, we force the UI to try and render
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- REDIRECT LOGIC ---
  useEffect(() => {
    // Only run redirects if Clerk is loaded and user is in the DB
    if (!clerkLoaded || !isSignedIn || userInfo === undefined) return;

    // 1. Handle New Users
    if (userInfo === null) {
      if (pathname !== "/onboarding") router.replace("/onboarding");
      return;
    }

    const isAdmin = userInfo.role === "admin";
    const isGatePage = pathname === "/onboarding" || pathname === "/waiting-approval";

    // 2. Admin Flow
    if (isAdmin) {
      if (isGatePage || pathname === "/") router.replace("/adminDashboard");
      return; 
    }

    // 3. Regular User Flow
    if (!userInfo.hasCompletedOnboarding) {
      if (pathname !== "/onboarding") router.replace("/onboarding");
      return;
    }

    if (!userInfo.isApproved) {
      if (pathname !== "/waiting-approval") router.replace("/waiting-approval");
      return;
    }

    // 4. Approved Users: send to SubmitPost
    if (userInfo.isApproved && (isGatePage || pathname === "/")) {
      router.replace("/submitPost");
    }
  }, [clerkLoaded, isSignedIn, userInfo, pathname, router]);

  // --- SIDEBAR VISIBILITY ---
  const isAdmin = userInfo?.role === "admin";
  const isApproved = userInfo?.isApproved === true;
  const isGatePage = pathname === "/onboarding" || pathname === "/waiting-approval";

  const shouldShowSidebar = 
    isSignedIn && 
    userInfo && 
    (isAdmin || (isApproved && !isGatePage));

  // Determine if we show the "Loading" spinner
  // We stop loading if: mounted AND (Clerk is Loaded OR 2 seconds have passed)
  const isLoading = !mounted || (!clerkLoaded && !timedOut);

  if (isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Initializing Red Tea...</p>
          <p className="text-[10px] text-gray-500 opacity-50">
            {!clerkLoaded ? "Connecting to Clerk..." : "Fetching Profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {shouldShowSidebar && (
        <Sidebar 
          activeTab={pathname === "/adminDashboard" ? "admin" : (pathname === "/submitPost" ? "submit" : "feed")} 
          onTabChange={(tab) => {
            if (tab === "admin") router.push("/adminDashboard");
            else router.push("/submitPost");
          }}
          isAdmin={isAdmin}
        />
      )}
      
      <main className={`flex-1 overflow-auto ${shouldShowSidebar ? "border-l border-gray-800" : ""}`}>
        {children}
      </main>
    </div>
  );
}