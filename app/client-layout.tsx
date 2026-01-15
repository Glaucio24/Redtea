"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar"; 
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generatePseudonym } from "@/lib/generatePseudonym";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const userInfo = useQuery((api.users as any).readUser, user?.id ? { clerkId: user.id } : "skip");
  const storeUser = useMutation((api.users as any).storeUser);
  
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => { setMounted(true); }, []);

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
    if (isAtGate) router.replace("/submitPost");
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

  // 🎯 HELPER: Determine which tab is active based on the URL
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
            // 🎯 FIXED: Map the tab ID to your actual folder routes
            if (tab === "admin") router.push("/adminDashboard");
            else if (tab === "feed") router.push("/communityFeed");
            else if (tab === "submit") router.push("/submitPost");
            else if (tab === "search") router.push("/search");
            else if (tab === "profile") router.push("/profile");
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