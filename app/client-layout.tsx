"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar"; 
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generatePseudonym } from "@/lib/generatePseudonym";
import { ShieldX, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const userInfo = useQuery(api.users.readUser, user?.id ? { clerkId: user.id } : "skip");
  const storeUser = useMutation(api.users.storeUser);
  
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Sync user data effect
  useEffect(() => {
    if (mounted && isAuthenticated && userInfo === null && !syncAttempted.current && user?.id) {
      syncAttempted.current = true;
      setIsSyncing(true);
      storeUser({ pseudonym: generatePseudonym(user.id) })
        .finally(() => {
          setTimeout(() => setIsSyncing(false), 800);
        });
    }
  }, [mounted, isAuthenticated, userInfo, storeUser, user?.id]);

  // Auth & Role protection effect
  useEffect(() => {
    if (!mounted || !clerkLoaded || authLoading || isSyncing) return;
    
    // 1. STABILITY CHECK: If userInfo is undefined (loading from Convex), 
    // do nothing. This prevents the "blink" redirect to onboarding while data refreshes.
    if (userInfo === undefined) return;

    // 2. Auth Check
    if (!isAuthenticated) {
      if (pathname !== "/" && !pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
        router.replace("/");
      }
      return;
    }

    // 3. ADMIN BYPASS (The Fix for the Admin redirect)
    if (userInfo?.role === "admin") {
      const isAtGate = pathname === "/" || pathname === "/onboarding" || pathname === "/waiting-approval";
      if (isAtGate) {
        router.replace("/adminDashboard");
      }
      return; // Stop here: Admins skip all onboarding/approval checks below
    }

    // 4. BANNED CHECK
    if (userInfo?.isBanned) return;

    // 5. REGULAR USER ONBOARDING/APPROVAL FLOW
    if (userInfo === null) return; 

    if (!userInfo.hasCompletedOnboarding) {
      if (pathname !== "/onboarding") router.replace("/onboarding");
      return;
    }
    if (!userInfo.isApproved) {
      if (pathname !== "/waiting-approval") router.replace("/waiting-approval");
      return;
    }

    const isAtGate = pathname === "/" || pathname === "/onboarding" || pathname === "/waiting-approval";
    if (isAtGate) router.replace("/communityFeed");
  }, [clerkLoaded, authLoading, isAuthenticated, userInfo, pathname, router, mounted, isSyncing]);

  if (!mounted || !clerkLoaded || authLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
      </div>
    );
  }

  if (userInfo?.isBanned) {
    return (
      <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
          <ShieldX className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Your account has been permanently suspended.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button 
            onClick={() => signOut().then(() => router.push("/"))}
            variant="ghost"
            className="text-gray-500 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const shouldShowSidebar = isAuthenticated && userInfo && (userInfo.role === "admin" || (userInfo.isApproved && !["/", "/onboarding", "/waiting-approval"].includes(pathname)));

  const getActiveTab = () => {
    if (pathname.includes("admin")) return "admin";
    if (pathname.includes("submit")) return "submit";
    if (pathname.includes("search")) return "search";
    if (pathname.includes("profile")) return "profile";
    return "feed";
  };

  return (
    <div className="flex min-h-screen bg-gray-900 items-start">
      {shouldShowSidebar && (
        <Sidebar 
          activeTab={getActiveTab()} 
          onTabChange={(tab) => {
            if (tab === "admin") router.push("/adminDashboard");
            else if (tab === "feed") router.push("/communityFeed");
            else if (tab === "submit") router.push("/submitPost");
            else if (tab === "search") router.push("/search");
            else if (tab === "profile" && userInfo?._id) router.push(`/profile/${userInfo._id}`);
          }}
          isAdmin={userInfo?.role === "admin"}
        />
      )}
      <main className={`flex-1 w-full ${shouldShowSidebar ? "border-l border-gray-800" : ""}`}>
        {children}
      </main>
    </div>
  );
}