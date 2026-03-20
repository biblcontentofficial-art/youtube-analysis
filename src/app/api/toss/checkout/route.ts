import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const plan = req.nextUrl.searchParams.get("plan") as TossPlanKey;
  if (!plan || !TOSS_PLANS[plan]) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  // req.nextUrl.origin 우선 사용 (도메인 변경 시에도 자동 대응)
  const appUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "https://bibllab.com";
  const planData = TOSS_PLANS[plan];
  const orderId = `order_${userId}_${plan}_${Date.now()}`;

  // 토스페이먼츠 결제창 URL 생성
  const params = new URLSearchParams({
    clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "",
    amount: planData.amount.toString(),
    orderId,
    orderName: planData.orderName,
    successUrl: `${appUrl}/api/toss/confirm?plan=${plan}`,
    failUrl: `${appUrl}/pricing?error=payment`,
    customerEmail: "",
    flowMode: "DEFAULT",
    easyPay: "토스페이",
  });

  return NextResponse.redirect(
    `https://pay.toss.im/v2/widget/payment?${params.toString()}`
  );
}
