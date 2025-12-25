"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar"; 
import { useUser } from "@clerk/nextjs";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  
  // 1. Add a mounted state to prevent hydration flickering
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
    if (tab === "feed") router.push("/dashboard"); // Redirecting to dashboard if that's your feed
    else if (tab === "submit") router.push("/submitPost");
    else if (tab === "admin") router.push("/adminDashboard");
  };

  // If we haven't mounted yet, return a consistent structure or null
  if (!mounted || !isLoaded) {
    return <div className="bg-gray-900 min-h-screen">{children}</div>;
  }

  // Hide sidebar on auth pages or when not signed in
  const hideSidebar = !isSignedIn || pathname?.startsWith("/sign-") || pathname === "/";

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}