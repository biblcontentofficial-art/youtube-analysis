import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { updateUserPlan } from "@/lib/auth";
import Stripe from "stripe";

// ── 중복 이벤트 방어: Redis에 처리된 event.id 기록 (TTL 7일) ──────────────
let redis: import("@upstash/redis").Redis | null = null;
async function getRedis() {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  try {
    const r = await getRedis();
    if (!r) return false;
    const exists = await r.get(`stripe:event:${eventId}`);
    return exists !== null;
  } catch {
    return false;
  }
}

async function markProcessed(eventId: string): Promise<void> {
  try {
    const r = await getRedis();
    if (!r) return;
    // 7일 보존 (Stripe 재시도 윈도우 커버)
    await r.set(`stripe:event:${eventId}`, 1, { ex: 60 * 60 * 24 * 7 });
  } catch { /* 기록 실패해도 이벤트 처리는 계속 */ }
}

async function updatePlan(userId: string, plan: string, event: string) {
  try {
    await updateUserPlan(userId, plan);
    console.log(`[stripe] ${event}: userId=${userId} plan=${plan} 업데이트 완료`);
  } catch (e) {
    console.error(`[stripe] ${event}: userId=${userId} plan=${plan} 플랜 업데이트 실패`, e);
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

  // ── 중복 이벤트 체크 ────────────────────────────────────────────────────
  if (await isAlreadyProcessed(event.id)) {
    console.log(`[stripe] 중복 이벤트 무시: ${event.id}`);
    return NextResponse.json({ ok: true });
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

  // ── 처리 완료 기록 ──────────────────────────────────────────────────────
  await markProcessed(event.id);

  return NextResponse.json({ ok: true });
}
