"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
 
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
   <button className="rounded-full bg-black/10 px-10 py-3 font-semibold no-underline transition hover:bg-black/20">
          Hello World
        </button>
    </main>
  );
}