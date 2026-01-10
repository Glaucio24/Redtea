import { api } from '@/convex/_generated/api';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { generatePseudonym } from '@/lib/generatePseudonym';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const { id } = evt.data;
    const eventType = evt.type;

    if (!id) return new Response('Missing ID', { status: 400 });

    switch (eventType) {
      case 'user.created': {
        const userData = {
          clerkId: id,
          email: (evt.data as any).email_addresses?.[0]?.email_address ?? "",
          name: `${(evt.data as any).first_name ?? ''} ${(evt.data as any).last_name ?? ''}`.trim(),
          pseudonym: generatePseudonym(id),
          hasCompletedOnboarding: false,
          isApproved: false,
          createdAt: Date.now(),
          selfieUrl: undefined,
          idUrl: undefined,
          isSubscribed: undefined,
          subscriptionPlan: undefined,
        };

        await convex.mutation(api.users.createUser, userData);
        break;
      }

      case 'user.deleted': {
        // 🎯 THE FIX: Calling 'deleteUser' as a public mutation
        await convex.mutation(api.users.deleteUser, { clerkId: id });
        console.log('🗑️ User removed from Convex:', id);
        break;
      }
    }

    return new Response('Webhook received', { status: 200 });
  } catch (err) {
    console.error('Webhook Error:', err);
    return new Response('Internal Error', { status: 500 });
  }
}