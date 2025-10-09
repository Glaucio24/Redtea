import { api } from '@/convex/_generated/api';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import {generatePseudonym} from '@/lib/generatePseudonym';


const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);



export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req); // Secret is automatically read from env

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Received webhook with ID ${id} and event type: ${eventType}`);
    console.log('Webhook payload:', evt.data);

    switch (eventType) {
      case 'user.created': {
        console.log('✅ User created:', evt.data.id);

        const userData = {
  clerkId: evt.data.id,
  email: evt.data.email_addresses?.[0]?.email_address ?? "", // set to empty string if null
  name: `${evt.data.first_name ?? ''} ${evt.data.last_name ?? ''}`.trim(),
  pseudonym: generatePseudonym(evt.data.id),          // <-- generate a deterministic pseudonym based on user ID
  hasCompletedOnboarding: false,           // <-- default to false
  isApproved: false,
  createdAt: Date.now(),
};


        await convex.mutation(api.users.createUser, userData);
        console.log('👤 User added to Convex:', userData.clerkId);
        break;
      }

      case 'user.deleted': {
        console.log('🗑️ User deleted:', evt.data.id);

        // Optional: delete user from Convex
        await convex.mutation(api.users.deleteUser, { clerkId: evt.data.id ?? "" });
        console.log('🗑️ User removed from Convex:', evt.data.id);
        break;
      }

      default:
        console.log('⚠️ Unhandled webhook event type:', eventType);
    }

    return new Response('Webhook received', { status: 200 });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }
}
