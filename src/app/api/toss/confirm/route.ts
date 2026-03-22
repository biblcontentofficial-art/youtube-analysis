import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";

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

    // 플랜 업데이트 (Clerk publicMetadata) — 결제 성공 후 best-effort
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: { plan },
      });
    } catch (metaErr) {
      // 메타데이터 업데이트 실패해도 결제는 완료됨 → 로그만 남기고 성공 처리
      console.error("Toss 플랜 메타데이터 업데이트 실패 (userId:", userId, "plan:", plan, "):", metaErr);
    }

    return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
  } catch (e) {
    console.error("Toss confirm error:", e);
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }
}
