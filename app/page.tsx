"use client";

import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp } = useSignUp();

  const handleGoogleAuth = async () => {
    if (!signIn || !signUp || !signInLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up", 
        redirectUrlComplete: "/", 
        continueSignUp: true, 
      });
    } catch (err) {
      console.error("Authentication error:", err);
    }
  };

  if (!isLoaded || isSignedIn) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-gray-900 p-10 shadow-2xl border border-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-24 w-24 relative">
            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full"></div>
            <img src="/redtea.png" alt="RedTea" className="relative h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">RedTea</h1>
          <p className="text-sm text-gray-400 font-medium">Verify your dating community</p>
        </div>
        <div className="space-y-6">
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-4 py-4 font-bold text-gray-900 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-xl"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="h-5 w-5" />
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
}