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
  selfieUrl: undefined,            // v.optional(v.string())
idUrl: undefined,                // v.optional(v.string())
 isSubscribed: undefined,             // v.optional(v.boolean()) - safest to pass the default type
subscriptionPlan: undefined,
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
    console.error('CRITICAL: Error processing webhook. This is likely a Convex validation error or connection issue.', err);
 // Return 500 to signal failure and stop Clerk retries until the error is fixed
return new Response('Internal Webhook Error', { status: 500 });
  }
}
