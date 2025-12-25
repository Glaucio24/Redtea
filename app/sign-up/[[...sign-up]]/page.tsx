"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4">
      {/* YOUR CUSTOM REDTEA LAYOUT */}
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-gray-900 p-8 shadow-2xl border border-gray-800">
        
        {/* Branding Header */}
        <div className="flex flex-col items-center space-y-4 mb-4">
          <div className="h-20 w-20 relative">
            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full"></div>
            <img
              src="/redtea.png"
              alt="RedTea Logo"
              className="relative h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create RedTea Account</h1>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Step 1: Identity Sync</p>
        </div>

        {/* CLERK CONTENT - Styled with standard Tailwind classes */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              // Instead of the 'dark' theme object, we use raw CSS classes
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none p-0",
                headerTitle: "hidden", 
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white text-black hover:bg-gray-100 border-none h-12 rounded-xl",
                socialButtonsBlockButtonText: "font-bold text-sm",
                dividerLine: "bg-gray-800",
                dividerText: "text-gray-500",
                formButtonPrimary: "bg-white text-black hover:bg-gray-200 border-none rounded-xl",
                footerAction: "hidden", // Hides the default "Already have an account?" text
                formFieldLabel: "text-gray-400",
                formFieldInput: "bg-gray-800 border-gray-700 text-white rounded-xl",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-red-400",
              },
            }}
          />
        </div>

        {/* Custom Footer */}
        <div className="text-center pt-6 border-t border-gray-800/50 mt-4">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            By creating an account, you acknowledge that RedTea requires <br/>
            government-issued ID for full community access.
          </p>
        </div>
      </div>
    </main>
  );
}