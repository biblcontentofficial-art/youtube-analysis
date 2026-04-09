/**
 * 토스페이먼츠 빌링 카드 등록 시작
 * GET /api/toss/billing/auth?plan=starter
 *
 * 흐름:
 * 1. 이 라우트로 진입 → 토스 빌링 인증 위젯으로 리다이렉트
 * 2. 사용자가 카드 등록 완료 → 토스가 /api/toss/billing/confirm 으로 authKey + customerKey 전달
 * 3. confirm 라우트에서 빌링키 발급 + 즉시 결제 + 플랜 업데이트
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in?redirect_url=/pricing", req.url));
  }

  const plan = req.nextUrl.searchParams.get("plan") as TossPlanKey;
  if (!plan || !TOSS_PLANS[plan]) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  if (!clientKey) {
    console.error("NEXT_PUBLIC_TOSS_CLIENT_KEY not set");
    return NextResponse.redirect(new URL("/pricing?error=billing", req.url));
  }

  const appUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "https://bibllab.com";

  // customerKey = userId (Clerk userId를 토스 고객 식별자로 사용)
  const params = new URLSearchParams({
    clientKey,
    customerKey: userId,
    successUrl: `${appUrl}/api/toss/billing/confirm?plan=${plan}`,
    failUrl: `${appUrl}/pricing?error=billing`,
  });

  // 토스페이먼츠 빌링 카드 등록 위젯으로 이동
  return NextResponse.redirect(
    `https://billing.toss.im/v2/widget/auth?${params.toString()}`
  );
}
