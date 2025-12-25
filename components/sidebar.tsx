"use client"

import { Home, Plus, Settings, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useClerk } from "@clerk/nextjs"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isAdmin: boolean
}

export function Sidebar({ activeTab, onTabChange, isAdmin }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { signOut } = useClerk()

  // Main tabs
  const tabs = [
    { id: "feed", icon: Home, label: "Community Feed" },
    { id: "submit", icon: Plus, label: "Submit Post" },
  ]

  // Admin tabs
  const adminTabs = [{ id: "admin", icon: Settings, label: "Admin Dashboard" }]

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-gray-800 p-2 rounded-md border border-gray-700 text-white hover:bg-gray-700"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static
          top-0 left-0
          h-screen
          w-64
          bg-gray-800
          border-r border-gray-700
          flex flex-col
          z-40
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <img
                src="/redtea.png"
                alt="Red Tea Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Red Tea</h1>
              <p className="text-xs text-gray-400">Anonymous Community</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 ${
                    activeTab === tab.id
                      ? "bg-green-600/20 text-green-300 border border-green-600/40"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </Button>
              )
            })}

            {/* Admin Section */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-2 px-3">
                  Administration
                </p>
                {adminTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      variant={activeTab === tab.id ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-3 h-12 ${
                        activeTab === tab.id
                          ? "bg-orange-600/20 text-orange-300 border border-orange-600/40"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="hover:text-gray-400 cursor-pointer">
              Community Guidelines
            </p>
            <p className="hover:text-gray-400 cursor-pointer">
              Privacy Policy
            </p>
            <p className="hover:text-gray-400 cursor-pointer">
              Report Content
            </p>
          </div>

          {/* Sign Out */}
          <Button
            onClick={() => signOut({ redirectUrl: "/" })}
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </div>
    </>
  )
}
