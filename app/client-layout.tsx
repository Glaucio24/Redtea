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
  
  // Fetch real-time user data from Convex
  const userInfo = useQuery(api.users.readUser, user ? { clerkId: user.id } : "skip");
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Redirect & Security Logic ---
  useEffect(() => {
    if (clerkLoaded && isSignedIn && userInfo !== undefined && userInfo !== null) {
      
      // 1. ADMIN REDIRECT 🛡️
      if (userInfo.role === "admin") {
        // If an admin accidentally lands on a gate page, send them to the cockpit
        if (pathname === "/onboarding" || pathname === "/waiting-approval") {
          router.replace("/adminDashboard");
        }
        return; 
      }

      // 2. ONBOARDING CHECK (Regular Users)
      if (!userInfo.hasCompletedOnboarding) {
        if (pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
        return;
      }

      // 3. APPROVAL CHECK (Regular Users)
      if (!userInfo.isApproved) {
        if (pathname !== "/waiting-approval") {
          router.replace("/waiting-approval");
        }
        return;
      }

      // 4. PREVENT GOING BACK (Regular Users)
      const gatePages = ["/onboarding", "/waiting-approval"];
      if (userInfo.isApproved && gatePages.includes(pathname)) {
        router.replace("/dashboard");
      }
    }
  }, [clerkLoaded, isSignedIn, userInfo, pathname, router]);

  const getActiveTab = () => {
    if (pathname === "/" || pathname === "/feed" || pathname === "/dashboard") return "feed";
    if (pathname === "/submitPost") return "submit";
    if (pathname === "/adminDashboard") return "admin";
    return "feed";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [pathname]);

  // 🎯 FIX: Use the role from your Convex DB, not Clerk metadata
  const isAdmin = userInfo?.role === "admin";

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "feed") router.push("/dashboard");
    else if (tab === "submit") router.push("/submitPost");
    else if (tab === "admin") router.push("/adminDashboard");
  };

  if (!mounted || !clerkLoaded) {
    return <div className="bg-gray-900 min-h-screen">{children}</div>;
  }

  // --- PROFESSIONAL HIDE LOGIC ---
  const isPublicPage = pathname === "/" || pathname?.startsWith("/sign-");
  const isWaitingPage = pathname === "/waiting-approval";
  const isAppPage = pathname === "/dashboard" || pathname === "/submitPost" || pathname === "/adminDashboard";

  // 🎯 FIX: Admins should ALWAYS see the sidebar on app pages, even if isApproved is false
  const shouldShowSidebar = 
    isSignedIn && 
    !isPublicPage && 
    !isWaitingPage && 
    (isAdmin || (userInfo && userInfo.isApproved));

  if (!shouldShowSidebar) {
    return <div className="bg-gray-900 min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-auto border-l border-gray-800">
        {children}
      </main>
    </div>
  );
}