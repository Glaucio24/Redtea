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
  const { user, isSignedIn, isLoaded } = useUser();
  
  // Fetch real-time user data from Convex to check approval status
  const userInfo = useQuery(api.users.readUser, user ? { clerkId: user.id } : "skip");
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isAdmin = user?.publicMetadata?.role === "admin" || false;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "feed") router.push("/dashboard");
    else if (tab === "submit") router.push("/submitPost");
    else if (tab === "admin") router.push("/adminDashboard");
  };

  if (!mounted || !isLoaded) {
    return <div className="bg-gray-900 min-h-screen">{children}</div>;
  }

  // 🎯 PROFESSIONAL HIDE LOGIC
  // We hide the sidebar if:
  // 1. User is not signed in
  // 2. We are on a sign-in/up page
  // 3. We are on the landing page (/)
  // 4. We are on the waiting-approval page
  // 5. The user exists in DB but is NOT approved yet
  const isWaitingPage = pathname === "/waiting-approval";
  const isPublicPage = pathname === "/" || pathname?.startsWith("/sign-");
  const isNotApproved = userInfo && !userInfo.isApproved;

  const hideSidebar = !isSignedIn || isPublicPage || isWaitingPage || isNotApproved;

  if (hideSidebar) {
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