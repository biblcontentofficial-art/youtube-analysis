/**
 * 포트원 v2 KG이니시스 빌링키 → 즉시 결제
 * POST /api/portone/billing/confirm
 * { billingKey, plan, customerName, customerPhone }
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PORTONE_PLANS, PORTONE_API_SECRET, PortonePlanKey } from "@/lib/portone";
import { upsertSubscription, insertPayment } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { billingKey, plan, customerName, customerPhone } = await req.json();

  if (!billingKey || !plan || !PORTONE_PLANS[plan as PortonePlanKey]) {
    return NextResponse.json({ message: "잘못된 요청" }, { status: 400 });
  }

  const apiSecret = PORTONE_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
  }

  const planData  = PORTONE_PLANS[plan as PortonePlanKey];
  const paymentId = `inicis_billing_${userId}_${plan}_${Date.now()}`;

  // 빌링키로 즉시 결제
  const chargeRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`, {
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
        phoneNumber: customerPhone || "",
      },
    }),
  });

  if (!chargeRes.ok) {
    const err = await chargeRes.json().catch(() => ({}));
    console.error("[PortOne Inicis] 결제 실패:", err);
    await insertPayment({ userId, plan: plan as PortonePlanKey, amount: planData.amount, orderId: paymentId, status: "failed", raw: err });
    return NextResponse.json({ message: "결제에 실패했습니다." }, { status: 400 });
  }

  const payment = await chargeRes.json();

  // Clerk 플랜 업데이트
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        plan,
        inicisPortoneBillingKey: billingKey,
        inicisPortonePlan: plan,
        inicisPortonePaidAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("[PortOne Inicis] Clerk 업데이트 실패:", e);
  }

  // DB 저장
  await Promise.all([
    upsertSubscription({ userId, plan: plan as PortonePlanKey, billingKey, customerKey: userId }),
    insertPayment({ userId, plan: plan as PortonePlanKey, amount: planData.amount, orderId: paymentId, paymentKey: payment.id ?? paymentId, status: "success", raw: payment }),
  ]);

  return NextResponse.json({ ok: true });
}
