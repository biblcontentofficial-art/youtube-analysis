/**
 * POST /api/admin/users/:id/refund
 * 관리자가 결제 환불 처리 (토스페이먼츠 취소 API + DB/Clerk 업데이트)
 *
 * Body: { paymentKey: string, cancelReason: string, cancelAmount?: number }
 *
 * 처리 순서:
 * 1. 토스페이먼츠 결제 취소 API 호출
 * 2. DB 결제 상태 → "cancelled"
 * 3. DB 구독 취소
 * 4. Clerk 플랜 → "free" + 빌링 메타데이터 제거
 */

import { currentUser } from "@/lib/auth";
import { updateUserPlan } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { updatePaymentStatus, cancelSubscription } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── 관리자 인증 ──
  const admin = await currentUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = admin.email ?? "";
  if (!isAdmin({ email, plan: admin.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  // ── 요청 파싱 ──
  let paymentKey: string;
  let cancelReason: string;
  let cancelAmount: number | undefined;

  try {
    const body = await req.json();
    paymentKey = body.paymentKey;
    cancelReason = body.cancelReason || "관리자 환불 처리";
    cancelAmount = body.cancelAmount;

    if (!paymentKey) {
      return NextResponse.json({ error: "paymentKey is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // ── Step 1: 토스페이먼츠 결제 취소 API ──
  const secretKey = process.env.TOSS_SECRET_KEY || "";
  if (!secretKey) {
    return NextResponse.json({ error: "TOSS_SECRET_KEY not configured" }, { status: 500 });
  }

  const base64 = Buffer.from(`${secretKey}:`).toString("base64");

  const cancelBody: Record<string, unknown> = { cancelReason };
  if (cancelAmount !== undefined) cancelBody.cancelAmount = cancelAmount;

  try {
    const cancelRes = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cancelBody),
      }
    );

    if (!cancelRes.ok) {
      const err = await cancelRes.json().catch(() => ({}));
      console.error("토스 환불 실패:", err);
      return NextResponse.json(
        { error: `토스 환불 실패: ${(err as { message?: string }).message || cancelRes.statusText}`, details: err },
        { status: cancelRes.status }
      );
    }

    const cancelData = await cancelRes.json();

    // ── Step 2: DB 결제 상태 업데이트 ──
    await updatePaymentStatus(paymentKey, "cancelled", cancelData);

    // ── Step 3: DB 구독 취소 ──
    await cancelSubscription(userId);

    // ── Step 4: 플랜 다운그레이드 ──
    try {
      await updateUserPlan(userId, "free");
    } catch (planErr) {
      console.error("플랜 업데이트 실패:", planErr);
      // 토스 환불은 성공했으므로 플랜 업데이트 실패는 경고로 반환
    }

    return NextResponse.json({
      success: true,
      cancelData: {
        paymentKey: cancelData.paymentKey,
        cancelAmount: cancelData.cancels?.[0]?.cancelAmount,
        cancelReason: cancelData.cancels?.[0]?.cancelReason,
        canceledAt: cancelData.cancels?.[0]?.canceledAt,
      },
    });
  } catch (e) {
    console.error("환불 처리 중 에러:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
