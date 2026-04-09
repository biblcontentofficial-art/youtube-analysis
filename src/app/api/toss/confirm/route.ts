import { auth } from "@/lib/auth";
import { updateUserPlan } from "@/lib/auth";
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
  if (!paymentKey || !orderId || !amount || isNaN(amountNum) || !plan || !userId) {
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }

  const secretKey = process.env.TOSS_SECRET_KEY || "";
  if (!secretKey) {
    console.error("TOSS_SECRET_KEY not set");
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }
  const base64 = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    // 토스페이먼츠 결제 승인 API 호출
    const confirmRes = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey, orderId, amount: amountNum }),
      }
    );

    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      console.error("Toss 결제 승인 실패:", err);
      return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
    }

    const chargeData = await confirmRes.json();

    // 플랜 업데이트 + DB 저장 (best-effort)
    await Promise.allSettled([
      updateUserPlan(userId, plan),
      upsertSubscription({ userId, plan, billingKey: "", customerKey: userId }),
      insertPayment({
        userId,
        plan,
        amount: amountNum,
        orderId: orderId!,
        paymentKey: chargeData.paymentKey,
        status: "success",
        raw: chargeData,
      }),
    ]);

    return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
  } catch (e) {
    console.error("Toss confirm error:", e);
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }
}
