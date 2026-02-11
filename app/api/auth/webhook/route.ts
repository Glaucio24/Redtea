import { api } from '@/convex/_generated/api';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { generatePseudonym } from '@/lib/generatePseudonym';

// ✅ Added interface to replace 'any'
interface ClerkUserWebhookData {
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const { id } = evt.data;
    const eventType = evt.type;

    if (!id) return new Response('Missing ID', { status: 400 });

    switch (eventType) {
      case 'user.created': {
        const data = evt.data as unknown as ClerkUserWebhookData;
        const userData = {
          clerkId: id,
          email: data.email_addresses?.[0]?.email_address ?? "",
          name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
          pseudonym: generatePseudonym(id),
          hasCompletedOnboarding: false,
          isApproved: false,
          createdAt: Date.now(),
        };

        await convex.mutation(api.users.createUser, userData);
        break;
      }

      case 'user.deleted': {
        await convex.mutation(api.users.deleteUser, { clerkId: id });
        break;
      }
    }

    return new Response('Webhook received', { status: 200 });
  } catch (err) {
    console.error('Webhook Error:', err);
    return new Response('Internal Error', { status: 500 });
  }
}