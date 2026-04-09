/**
 * 포트원 v2 결제 검증
 * POST /api/portone/confirm  { paymentId, plan }
 * GET  /api/portone/confirm?paymentId=...&plan=...  (redirect 방식)
 */

import { auth } from "@/lib/auth";
import { updateUserPlan } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PORTONE_PLANS, PORTONE_API_SECRET, PortonePlanKey } from "@/lib/portone";
import { upsertSubscription, insertPayment } from "@/lib/db";

async function verifyAndActivate(req: NextRequest, paymentId: string, plan: PortonePlanKey, userId: string) {
  const apiSecret = PORTONE_API_SECRET;
  if (!apiSecret) {
    console.error("PORTONE_API_SECRET not set");
    return { ok: false, message: "서버 설정 오류" };
  }

  const planData = PORTONE_PLANS[plan];

  // 포트원 v2 결제 조회 API
  const verifyRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `PortOne ${apiSecret}`,
    },
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    console.error("[PortOne] 결제 조회 실패:", err);
    return { ok: false, message: "결제 조회 실패" };
  }

  const payment = await verifyRes.json();

  // 금액 검증
  if (payment.amount?.total !== planData.amount) {
    console.error("[PortOne] 금액 불일치:", payment.amount?.total, "≠", planData.amount);
    await insertPayment({ userId, plan, amount: payment.amount?.total ?? 0, orderId: paymentId, status: "failed", raw: payment });
    return { ok: false, message: "결제 금액이 일치하지 않습니다." };
  }

  if (payment.status !== "PAID") {
    return { ok: false, message: `결제 상태 오류: ${payment.status}` };
  }

  // 플랜 업데이트
  try {
    await updateUserPlan(userId, plan);
  } catch (e) {
    console.error("[PortOne] 플랜 업데이트 실패:", e);
  }

  // DB 저장
  await Promise.all([
    upsertSubscription({ userId, plan, billingKey: paymentId, customerKey: userId }),
    insertPayment({ userId, plan, amount: planData.amount, orderId: paymentId, paymentKey: paymentId, status: "success", raw: payment }),
  ]);

  return { ok: true };
}

// POST (팝업 결제)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { paymentId, plan } = await req.json();
  if (!paymentId || !plan || !PORTONE_PLANS[plan as PortonePlanKey]) {
    return NextResponse.json({ message: "잘못된 요청" }, { status: 400 });
  }

  const result = await verifyAndActivate(req, paymentId, plan as PortonePlanKey, userId);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// GET (redirect 결제)
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const plan = req.nextUrl.searchParams.get("plan") as PortonePlanKey;

  if (!paymentId || !plan || !PORTONE_PLANS[plan]) {
    return NextResponse.redirect(new URL("/pricing?error=portone", req.url));
  }

  const result = await verifyAndActivate(req, paymentId, plan, userId);
  if (!result.ok) return NextResponse.redirect(new URL("/pricing?error=portone", req.url));
  return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
}
