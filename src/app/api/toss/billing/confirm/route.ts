/**
 * 토스페이먼츠 빌링 카드 등록 완료 + 즉시 결제
 * GET /api/toss/billing/confirm?authKey=...&customerKey=...&plan=starter
 *
 * 흐름:
 * 1. 토스에서 authKey + customerKey 전달
 * 2. authKey로 billingKey 발급 (카드 등록 완료)
 * 3. billingKey로 즉시 첫 결제 실행
 * 4. Clerk 사용자 메타데이터에 plan + tossBillingKey 저장
 * 5. /search?upgraded=1 로 리다이렉트
 */

import { auth, currentUser } from "@/lib/auth";
import { updateUserPlan } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";
import { upsertSubscription, insertPayment } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  const authKey = req.nextUrl.searchParams.get("authKey");
  const customerKey = req.nextUrl.searchParams.get("customerKey");
  const plan = req.nextUrl.searchParams.get("plan") as TossPlanKey;
  const period = req.nextUrl.searchParams.get("period") === "monthly" ? "monthly" : "yearly";

  if (!authKey || !customerKey || !plan || !TOSS_PLANS[plan] || !userId) {
    return NextResponse.redirect(new URL("/pricing?error=billing", req.url));
  }

  const secretKey = process.env.TOSS_SECRET_KEY || "";
  if (!secretKey) {
    console.error("TOSS_SECRET_KEY not set");
    return NextResponse.redirect(new URL("/pricing?error=billing", req.url));
  }

  const base64 = Buffer.from(`${secretKey}:`).toString("base64");
  const planData = TOSS_PLANS[plan];
  // period에 따라 실제 결제 금액 결정 (yearly: 연간 일시불 / monthly: 월간 금액)
  const chargeAmount = period === "yearly" ? planData.yearlyAmount : planData.monthlyAmount;
  const orderNameSuffix = period === "yearly" ? " (연간)" : " (월간)";

  // 이메일 조회 (결제 영수증용)
  const authUser = await currentUser().catch(() => null);
  const customerEmail = authUser?.email ?? "";

  try {
    // ── Step 1: authKey → billingKey 발급 ────────────────────────────
    const issueRes = await fetch(
      "https://api.tosspayments.com/v1/billing/authorizations/issue",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey, customerKey }),
      }
    );

    if (!issueRes.ok) {
      const err = await issueRes.json().catch(() => ({}));
      console.error("Toss 빌링키 발급 실패:", err);
      return NextResponse.redirect(new URL("/pricing?error=billing", req.url));
    }

    const { billingKey } = await issueRes.json();

    // ── Step 2: billingKey로 즉시 결제 ───────────────────────────────
    // authKey는 토스에서 단 1회만 발급 → 동일 orderId 보장 → 중복 결제 자동 방지
    const orderId = `billing_${userId}_${plan}_${authKey.slice(-16)}`;

    const chargeRes = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerKey,
          amount: chargeAmount,
          orderId,
          orderName: planData.orderName + orderNameSuffix,
          customerEmail,
        }),
      }
    );

    if (!chargeRes.ok) {
      const err = await chargeRes.json().catch(() => ({}));
      console.error("Toss 빌링 결제 실패:", err);
      // 결제 실패 이력도 DB에 저장
      await insertPayment({
        userId,
        plan,
        amount: planData.amount,
        orderId,
        status: "failed",
        raw: err,
      });
      return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
    }

    const chargeData = await chargeRes.json();

    // ── Step 3: 플랜 업데이트 ────────────────────────────────────────
    try {
      await updateUserPlan(userId, plan);
    } catch (metaErr) {
      console.error("Toss 빌링 플랜 업데이트 실패:", metaErr);
    }

    // ── Step 4: DB에 구독 & 결제 이력 저장 ───────────────────────────
    await Promise.all([
      upsertSubscription({
        userId,
        plan,
        billingKey,
        customerKey,
      }),
      insertPayment({
        userId,
        plan,
        amount: planData.amount,
        orderId,
        paymentKey: chargeData.paymentKey,
        status: "success",
        raw: chargeData,
      }),
    ]);

    return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
  } catch (e) {
    console.error("Toss billing confirm error:", e);
    return NextResponse.redirect(new URL("/pricing?error=billing", req.url));
  }
}
