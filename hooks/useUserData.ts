import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";


 //A custom hook that merges Clerk user info with Convex user data.
 // Ensures we only query Convex after Clerk user is available.
export function useUserData() {
  const { user, isLoaded: isClerkLoaded } = useUser();

  // Only fetch from Convex once Clerk has loaded
  const userData = useQuery(
    api.users.readUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Derived states for cleaner component logic
  const isLoading = !isClerkLoaded || (user && !userData);
  const isSignedIn = !!user;
  const isOnboarded = userData?.hasCompletedOnboarding ?? false;

  return {
    user,          // Clerk user object (email, profile image, etc.)
    userData,      // Convex user record (pseudonym, approvals, etc.)
    isLoading,
    isSignedIn,
    isOnboarded,
  };
}
