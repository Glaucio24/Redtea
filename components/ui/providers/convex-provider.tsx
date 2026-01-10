"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
// 🎯 This is the special provider that links Convex and Clerk
import { ConvexProviderWithClerk } from "convex/react-clerk";
// 🎯 We need useAuth to bridge the two
import { ClerkProvider, useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}