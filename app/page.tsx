"use client";

import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();

  const handleGoogleAuth = async () => {
    if (!signIn || !signUp) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        // 🎯 FIX: We provide the property to stop the TypeScript error.
        // We use the standard Clerk callback path.
        redirectUrl: "/sign-up", 
        redirectUrlComplete: "/dashboard", 
        continueSignUp: true, 
      });
    } catch (err) {
      console.error("Authentication error:", err);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white/50 animate-pulse font-medium tracking-widest text-xs uppercase">
          Initializing RedTea...
        </div>
      </div>
    );
  }

  if (isSignedIn) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-gray-900 p-10 shadow-2xl border border-gray-800">

        <div className="flex flex-col items-center space-y-4">
          <div className="h-24 w-24 relative">
             <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full"></div>
            <img
              src="/redtea.png"
              alt="RedTea Logo"
              className="relative h-full w-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">RedTea</h1>
          <p className="text-sm text-gray-400 font-medium">Verify your dating community</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-4 py-4 font-bold text-gray-900 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-xl"
          >
            <img
              src="/google-icon.png"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>
          
          <div className="flex items-center justify-center gap-2">
            <span className="h-1 w-1 rounded-full bg-green-500"></span>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
              Secure Cloud Sync
            </p>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-gray-800/50">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            By continuing, you agree to our community standards.<br/>
            Beta access requires manual ID approval.
          </p>
        </div>
      </div>
    </main>
  );
}