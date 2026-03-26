/**
 * 월정기 자동 결제 Cron Job
 * GET /api/cron/billing
 *
 * Vercel Cron으로 매일 실행 → next_billing_at이 지난 active 구독에 대해
 * 토스페이먼츠 빌링키로 월 결제를 실행하고 next_billing_at을 +1개월 갱신.
 *
 * 취소된(cancelled) 구독의 경우: next_billing_at이 지났으면 Clerk 플랜을 free로 내림.
 */

import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";
import { insertPayment } from "@/lib/db";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 전송
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
  const client = await clerkClient();

  for (const sub of expired) {
    try {
      await client.users.updateUserMetadata(sub.user_id, {
        publicMetadata: { plan: "free" },
      });
      // 만료 처리: status를 expired로 변경
      await db
        .from("subscriptions")
        .update({ status: "expired", updated_at: now })
        .eq("user_id", sub.user_id);
    } catch (e) {
      console.error(`[cron/billing] 만료 다운그레이드 실패 userId=${sub.user_id}:`, e);
    }
  }

  // ── 2. 결제일이 지난 active 구독 → 토스 빌링키로 월 결제 실행 ────────────
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

  const secretKey = process.env.TOSS_SECRET_KEY || "";
  const base64 = Buffer.from(`${secretKey}:`).toString("base64");

  const results: Array<{ userId: string; status: string; reason?: string }> = [];

  for (const sub of dueSubscriptions ?? []) {
    const plan = sub.plan as TossPlanKey;
    const planData = TOSS_PLANS[plan];

    if (!planData) {
      results.push({ userId: sub.user_id, status: "skipped", reason: "unknown plan" });
      continue;
    }

    // orderId: 날짜 기반으로 중복 방지
    const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderId = `billing_renewal_${sub.user_id}_${plan}_${dateSuffix}`;

    try {
      // 이메일 조회 (영수증용)
      const clerkUser = await client.users.getUser(sub.user_id).catch(() => null);
      const customerEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

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
        console.error(`[cron/billing] 결제 실패 userId=${sub.user_id}:`, chargeData);
        await insertPayment({
          userId: sub.user_id,
          plan,
          amount: planData.amount,
          orderId,
          status: "failed",
          raw: chargeData,
        });
        results.push({ userId: sub.user_id, status: "failed", reason: chargeData.message });
        continue;
      }

      // 결제 성공 → next_billing_at +1개월
      const nextBillingAt = new Date();
      nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

      await db
        .from("subscriptions")
        .update({
          next_billing_at: nextBillingAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", sub.user_id);

      await insertPayment({
        userId: sub.user_id,
        plan,
        amount: planData.amount,
        orderId,
        paymentKey: chargeData.paymentKey,
        status: "success",
        raw: chargeData,
      });

      results.push({ userId: sub.user_id, status: "success" });
    } catch (e) {
      console.error(`[cron/billing] 예외 userId=${sub.user_id}:`, e);
      results.push({ userId: sub.user_id, status: "error", reason: String(e) });
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
