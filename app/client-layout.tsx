"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar"; 
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generatePseudonym } from "@/lib/generatePseudonym";
import { ShieldX } from "lucide-react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  // 1. Fetch User Info
  const userInfo = useQuery((api.users as any).readUser, user?.id ? { clerkId: user.id } : "skip");
  const storeUser = useMutation((api.users as any).storeUser);
  
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // 2. BAN GUARD
  if (userInfo?.isBanned) {
    return (
      <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <ShieldX className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Your account has been permanently suspended for violating our community standards. 
          All associated data has been restricted.
        </p>
        <button 
          onClick={() => window.location.href = "mailto:support@yourdomain.com"}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Appeal Suspension
        </button>
      </div>
    );
  }

  // 3. SYNC LOGIC
  useEffect(() => {
    if (isAuthenticated && userInfo === null && !syncAttempted.current && user?.id) {
      syncAttempted.current = true;
      setIsSyncing(true);
      storeUser({ pseudonym: generatePseudonym(user.id) })
        .finally(() => {
          setTimeout(() => setIsSyncing(false), 800);
        });
    }
  }, [isAuthenticated, userInfo, storeUser, user?.id]);

  // 4. NAVIGATION GATEKEEPER
  useEffect(() => {
    if (!mounted || !clerkLoaded || authLoading || isSyncing) return;

    if (!isAuthenticated) {
      if (pathname !== "/" && !pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
        router.replace("/");
      }
      return;
    }

    if (userInfo === undefined || userInfo === null) return;

    if (userInfo.role === "admin") {
      if (pathname === "/") router.replace("/adminDashboard");
      return;
    }

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

  const isWaiting = !mounted || authLoading || isSyncing || (isAuthenticated && (userInfo === undefined || userInfo === null));
  
  if (isWaiting) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/40 animate-pulse text-[10px] uppercase tracking-[0.2em] font-bold">
          Authenticating...
        </p>
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
    <div className="flex min-h-screen bg-gray-900">
      {shouldShowSidebar && (
        <Sidebar 
          activeTab={getActiveTab()} 
          onTabChange={(tab) => {
            if (tab === "admin") router.push("/adminDashboard");
            else if (tab === "feed") router.push("/communityFeed");
            else if (tab === "submit") router.push("/submitPost");
            else if (tab === "search") router.push("/search");
            // FIXED: Path now uses dynamic [id]
            else if (tab === "profile" && userInfo?._id) router.push(`/profile/${userInfo._id}`);
          }}
          isAdmin={userInfo?.role === "admin"}
        />
      )}
      <main className={`flex-1 overflow-auto ${shouldShowSidebar ? "border-l border-gray-800" : ""}`}>
        {children}
      </main>
    </div>
  );
}