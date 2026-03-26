/**
 * 포트원 v2 빌링키 → 즉시 결제
 * POST /api/portone/billing/confirm
 * { billingKey, plan, pgType, customerName, customerEmail }
 *
 * pgType: "kakaopay" | "naverpay" | "card" | "kcp" | "inicis"
 * billing_key는 "portone:{실제키}" 형태로 저장 → cron에서 Toss와 구분
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PORTONE_PLANS, PORTONE_API_SECRET, PORTONE_BILLING_KEY_PREFIX, PortonePlanKey } from "@/lib/portone";
import { upsertSubscription, insertPayment } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { billingKey, plan, pgType, customerName, customerEmail } = await req.json();

  if (!billingKey || !plan || !PORTONE_PLANS[plan as PortonePlanKey]) {
    return NextResponse.json({ message: "잘못된 요청" }, { status: 400 });
  }

  const apiSecret = PORTONE_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
  }

  const planData  = PORTONE_PLANS[plan as PortonePlanKey];
  const pg        = pgType || "card";
  const paymentId = `portone_${pg}_${userId}_${plan}_${Date.now()}`;

  // 빌링키로 즉시 결제 실행
  const chargeRes = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
    {
      method: "POST",
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billingKey,
        orderName: planData.orderName,
        amount:    { total: planData.amount },
        currency:  "KRW",
        customer: {
          id:          userId,
          name:        { full: customerName || "고객" },
          email:       customerEmail || "",
        },
      }),
    }
  );

  if (!chargeRes.ok) {
    const err = await chargeRes.json().catch(() => ({}));
    console.error(`[PortOne ${pg}] 결제 실패:`, err);
    await insertPayment({
      userId,
      plan: plan as PortonePlanKey,
      amount: planData.amount,
      orderId: paymentId,
      status: "failed",
      raw: err,
    });
    return NextResponse.json({ message: "결제에 실패했습니다." }, { status: 400 });
  }

  const payment = await chargeRes.json();

  // Clerk 플랜 업데이트
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        plan,
        portonePg: pg,
        portoneBillingKey: billingKey,
        portonePaidAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error(`[PortOne ${pg}] Clerk 업데이트 실패:`, e);
  }

  // billing_key에 "portone:" prefix 붙여서 저장 → cron에서 Toss와 구분
  const storedBillingKey = `${PORTONE_BILLING_KEY_PREFIX}${billingKey}`;

  await Promise.all([
    upsertSubscription({
      userId,
      plan: plan as PortonePlanKey,
      billingKey: storedBillingKey,
      customerKey: userId,
    }),
    insertPayment({
      userId,
      plan: plan as PortonePlanKey,
      amount: planData.amount,
      orderId: paymentId,
      paymentKey: payment.id ?? paymentId,
      status: "success",
      raw: payment,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
