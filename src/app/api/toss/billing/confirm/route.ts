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

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  const authKey = req.nextUrl.searchParams.get("authKey");
  const customerKey = req.nextUrl.searchParams.get("customerKey");
  const plan = req.nextUrl.searchParams.get("plan") as TossPlanKey;

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
    const orderId = `billing_${userId}_${plan}_${Date.now()}`;

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
          amount: planData.amount,
          orderId,
          orderName: planData.orderName,
          customerEmail: "",  // Clerk에서 이메일 가져오기 어려워 빈값 허용
        }),
      }
    );

    if (!chargeRes.ok) {
      const err = await chargeRes.json().catch(() => ({}));
      console.error("Toss 빌링 결제 실패:", err);
      return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
    }

    // ── Step 3: Clerk 메타데이터 업데이트 ────────────────────────────
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan,
          tossBillingKey: billingKey,
          tossBillingPlan: plan,
          tossBilledAt: new Date().toISOString(),
        },
      });
    } catch (metaErr) {
      // 메타데이터 업데이트 실패해도 결제는 완료됨 → 로그만
      console.error("Toss 빌링 메타데이터 업데이트 실패:", metaErr);
    }

    return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
  } catch (e) {
    console.error("Toss billing confirm error:", e);
    return NextResponse.redirect(new URL("/pricing?error=billing", req.url));
  }
}
