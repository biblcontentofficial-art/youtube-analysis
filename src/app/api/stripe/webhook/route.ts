import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { plan },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = (subscription.metadata as Record<string, string>)?.userId;
    if (userId) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { plan: "free" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
