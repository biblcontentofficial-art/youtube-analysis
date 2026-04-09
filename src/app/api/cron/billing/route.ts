/**
 * 월정기 자동 결제 Cron Job
 * GET /api/cron/billing
 *
 * Vercel Cron으로 매일 실행 → next_billing_at이 지난 active 구독에 대해
 * PG별(Toss / PortOne)로 월 결제를 실행하고 next_billing_at을 +1개월 갱신.
 *
 * PG 구분: billing_key가 "portone:" prefix이면 PortOne, 아니면 Toss
 *
 * 취소된(cancelled) 구독의 경우: next_billing_at이 지났으면 Clerk 플랜을 free로 내림.
 */

import { NextRequest, NextResponse } from "next/server";
import { updateUserPlan } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";
import { PORTONE_PLANS, PORTONE_API_SECRET, PORTONE_BILLING_KEY_PREFIX, PortonePlanKey } from "@/lib/portone";
import { insertPayment } from "@/lib/db";
import { verifyBearerToken } from "@/lib/authUtils";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 전송 (timing-safe 비교)
  if (!verifyBearerToken(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const now = new Date().toISOString();

  // ── 1. 취소됐지만 기간이 지난 구독 → Clerk 플랜 free로 다운그레이드 ──────
  const { data: expiredSubs } = await db
    .from("subscriptions")
    .select("user_id")
    .eq("status", "cancelled")
    .lte("next_billing_at", now);

  const expired = expiredSubs ?? [];

  for (const sub of expired) {
    try {
      await updateUserPlan(sub.user_id, "free");
      await db
        .from("subscriptions")
        .update({ status: "expired", updated_at: now })
        .eq("user_id", sub.user_id);
    } catch (e) {
      console.error(`[cron/billing] 만료 다운그레이드 실패 userId=${sub.user_id}:`, e);
    }
  }

  // ── 2. 결제일이 지난 active 구독 → PG별로 월 결제 실행 ──────────────────
  const { data: dueSubscriptions, error } = await db
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .lte("next_billing_at", now)
    .not("billing_key", "is", null);

  if (error) {
    console.error("[cron/billing] DB 조회 실패:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const results: Array<{ userId: string; status: string; pg?: string; reason?: string }> = [];

  for (const sub of dueSubscriptions ?? []) {
    const isPortone = (sub.billing_key as string).startsWith(PORTONE_BILLING_KEY_PREFIX);

    if (isPortone) {
      await chargePortone(sub, db, now, results);
    } else {
      await chargeToss(sub, db, now, results);
    }
  }

  console.log(`[cron/billing] 완료: expired=${expired.length}, charged=${results.length}`, results);

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    processed: results.length,
    results,
  });
}

// ─────────────────────────────────────────────────────────────
// Toss 결제 실행
// ─────────────────────────────────────────────────────────────
async function chargeToss(
  sub: Record<string, string>,
  db: NonNullable<ReturnType<typeof getSupabase>>,
  now: string,
  results: Array<{ userId: string; status: string; pg?: string; reason?: string }>
) {
  const plan     = sub.plan as TossPlanKey;
  const planData = TOSS_PLANS[plan];

  if (!planData) {
    results.push({ userId: sub.user_id, status: "skipped", pg: "toss", reason: "unknown plan" });
    return;
  }

  const secretKey = process.env.TOSS_SECRET_KEY || "";
  const base64    = Buffer.from(`${secretKey}:`).toString("base64");
  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const orderId    = `billing_renewal_${sub.user_id}_${plan}_${dateSuffix}`;

  try {
    // Get email from profiles table
    const { data: profile } = await db.from("profiles").select("email").eq("id", sub.user_id).single();
    const customerEmail = profile?.email ?? "";

    const chargeRes = await fetch(
      `https://api.tosspayments.com/v1/billing/${sub.billing_key}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerKey: sub.customer_key || sub.user_id,
          amount: planData.amount,
          orderId,
          orderName: planData.orderName,
          customerEmail,
        }),
      }
    );

    const chargeData = await chargeRes.json();

    if (!chargeRes.ok) {
      console.error(`[cron/billing/toss] 결제 실패 userId=${sub.user_id}:`, chargeData);
      await insertPayment({ userId: sub.user_id, plan, amount: planData.amount, orderId, status: "failed", raw: chargeData });
      results.push({ userId: sub.user_id, status: "failed", pg: "toss", reason: chargeData.message });
      return;
    }

    const nextBillingAt = new Date();
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

    await db.from("subscriptions").update({ next_billing_at: nextBillingAt.toISOString(), updated_at: now }).eq("user_id", sub.user_id);
    await insertPayment({ userId: sub.user_id, plan, amount: planData.amount, orderId, paymentKey: chargeData.paymentKey, status: "success", raw: chargeData });

    results.push({ userId: sub.user_id, status: "success", pg: "toss" });
  } catch (e) {
    console.error(`[cron/billing/toss] 예외 userId=${sub.user_id}:`, e);
    results.push({ userId: sub.user_id, status: "error", pg: "toss", reason: String(e) });
  }
}

// ─────────────────────────────────────────────────────────────
// PortOne 결제 실행
// ─────────────────────────────────────────────────────────────
async function chargePortone(
  sub: Record<string, string>,
  db: NonNullable<ReturnType<typeof getSupabase>>,
  now: string,
  results: Array<{ userId: string; status: string; pg?: string; reason?: string }>
) {
  const plan     = sub.plan as PortonePlanKey;
  const planData = PORTONE_PLANS[plan];

  if (!planData) {
    results.push({ userId: sub.user_id, status: "skipped", pg: "portone", reason: "unknown plan" });
    return;
  }

  const apiSecret = PORTONE_API_SECRET;
  if (!apiSecret) {
    results.push({ userId: sub.user_id, status: "skipped", pg: "portone", reason: "PORTONE_API_SECRET not set" });
    return;
  }

  // "portone:" prefix 제거하여 실제 빌링키 추출
  const actualBillingKey = (sub.billing_key as string).slice(PORTONE_BILLING_KEY_PREFIX.length);
  const dateSuffix       = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const paymentId        = `portone_renewal_${sub.user_id}_${plan}_${dateSuffix}`;

  try {
    // Get user info from profiles table
    const { data: profile } = await db.from("profiles").select("email, first_name").eq("id", sub.user_id).single();
    const email    = profile?.email ?? "";
    const fullName = profile?.first_name || "고객";

    const chargeRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
      {
        method: "POST",
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingKey: actualBillingKey,
          orderName: planData.orderName,
          amount:    { total: planData.amount },
          currency:  "KRW",
          customer: {
            id:    sub.user_id,
            name:  { full: fullName },
            email,
          },
        }),
      }
    );

    const chargeData = await chargeRes.json();

    if (!chargeRes.ok) {
      console.error(`[cron/billing/portone] 결제 실패 userId=${sub.user_id}:`, chargeData);
      await insertPayment({ userId: sub.user_id, plan, amount: planData.amount, orderId: paymentId, status: "failed", raw: chargeData });
      results.push({ userId: sub.user_id, status: "failed", pg: "portone", reason: chargeData.message });
      return;
    }

    const nextBillingAt = new Date();
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

    await db.from("subscriptions").update({ next_billing_at: nextBillingAt.toISOString(), updated_at: now }).eq("user_id", sub.user_id);
    await insertPayment({ userId: sub.user_id, plan, amount: planData.amount, orderId: paymentId, paymentKey: chargeData.id ?? paymentId, status: "success", raw: chargeData });

    results.push({ userId: sub.user_id, status: "success", pg: "portone" });
  } catch (e) {
    console.error(`[cron/billing/portone] 예외 userId=${sub.user_id}:`, e);
    results.push({ userId: sub.user_id, status: "error", pg: "portone", reason: String(e) });
  }
}
