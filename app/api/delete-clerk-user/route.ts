import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { clerkId } = await req.json();
    const client = await clerkClient();
    await client.users.deleteUser(clerkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}