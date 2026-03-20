import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

async function updatePlan(userId: string, plan: string, event: string) {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, { publicMetadata: { plan } });
    console.log(`[stripe] ${event}: userId=${userId} plan=${plan} 업데이트 완료`);
  } catch (e) {
    console.error(`[stripe] ${event}: userId=${userId} plan=${plan} 메타데이터 업데이트 실패`, e);
    // Stripe에 500을 반환하면 재시도함 — 여기서는 성공 응답을 유지해 무한 재시도 방지
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error("[stripe] Stripe 초기화 실패:", e);
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (userId && plan) {
      await updatePlan(userId, plan, event.type);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan;
    if (userId && plan) {
      await updatePlan(userId, plan, event.type);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) {
      await updatePlan(userId, "free", event.type);
    }
  }

  return NextResponse.json({ ok: true });
}
