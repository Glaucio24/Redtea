import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ui/providers/convex-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { LayoutContent } from "./client-layout"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Red Tea",
  description: "A place for dating feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0`}
        suppressHydrationWarning
      >
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
          </ConvexClientProvider>
          <Toaster theme="dark" position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}