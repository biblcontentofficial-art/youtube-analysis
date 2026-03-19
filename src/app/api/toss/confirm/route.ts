import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const paymentKey = req.nextUrl.searchParams.get("paymentKey");
  const orderId = req.nextUrl.searchParams.get("orderId");
  const amount = req.nextUrl.searchParams.get("amount");
  const plan = req.nextUrl.searchParams.get("plan") as TossPlanKey;

  if (!paymentKey || !orderId || !amount || !plan || !userId) {
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }

  const secretKey = process.env.TOSS_SECRET_KEY || "";
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
        body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
      }
    );

    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      console.error("Toss 결제 승인 실패:", err);
      return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
    }

    // 플랜 업데이트 (Clerk publicMetadata)
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { plan },
    });

    return NextResponse.redirect(new URL("/search?upgraded=1", req.url));
  } catch (e) {
    console.error("Toss confirm error:", e);
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }
}
