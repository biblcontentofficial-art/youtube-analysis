/**
 * 토스페이먼츠 결제위젯 결제 승인
 * GET /api/toss/widget/confirm?paymentKey=...&orderId=...&amount=...&plan=starter
 *
 * 흐름:
 * 1. 결제위젯에서 결제 인증 완료 → 이 라우트로 리다이렉트
 * 2. 토스 결제 승인 API 호출
 * 3. Clerk 플랜 업데이트 + DB 저장
 * 4. /search?upgraded=1 로 리다이렉트
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";
import { upsertSubscription, insertPayment } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  const paymentKey = req.nextUrl.searchParams.get("paymentKey");
  const orderId = req.nextUrl.searchParams.get("orderId");
  const amount = req.nextUrl.searchParams.get("amount");
  const plan = req.nextUrl.searchParams.get("plan") as TossPlanKey;

  const amountNum = parseInt(amount ?? "0");
  if (!paymentKey || !orderId || !amount || isNaN(amountNum) || !plan || !TOSS_PLANS[plan] || !userId) {
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }

  // 결제위젯 시크릿 키 (없으면 일반 시크릿 키 fallback)
  const secretKey = process.env.TOSS_WIDGET_SECRET_KEY || process.env.TOSS_SECRET_KEY || "";
  if (!secretKey) {
    console.error("TOSS_WIDGET_SECRET_KEY not set");
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }

  const base64 = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    // ── 결제 승인 API 호출 ─────────────────────────────────────────────
    const confirmRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount: amountNum }),
    });

    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      console.error("Toss 결제위젯 승인 실패:", err);
      await insertPayment({
        userId,
        plan,
        amount: amountNum,
        orderId,
        status: "failed",
        raw: err,
      });
      return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
    }

    const paymentData = await confirmRes.json();

    // ── Clerk 플랜 업데이트 ────────────────────────────────────────────
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan,
          tossPaymentKey: paymentData.paymentKey,
          tossPaidAt: new Date().toISOString(),
        },
      });
    } catch (metaErr) {
      console.error("Clerk 메타데이터 업데이트 실패:", metaErr);
    }

    // ── DB 저장 ────────────────────────────────────────────────────────
    await Promise.allSettled([
      upsertSubscription({ userId, plan, billingKey: "", customerKey: userId }),
      insertPayment({
        userId,
        plan,
        amount: amountNum,
        orderId,
        paymentKey: paymentData.paymentKey,
        status: "success",
        raw: paymentData,
      }),
    ]);

    return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
  } catch (e) {
    console.error("Toss widget confirm error:", e);
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }
}
