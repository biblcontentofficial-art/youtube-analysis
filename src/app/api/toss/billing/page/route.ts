/**
 * 토스페이먼츠 빌링 카드등록 페이지 (순수 HTML)
 * GET /api/toss/billing/page?plan=starter&customerKey=...&email=...&name=...
 *
 * React/Next.js 환경을 완전히 우회하여 토스 SDK를 직접 실행.
 * 공식 가이드 HTML 샘플과 동일한 구조.
 */

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

  const planData = TOSS_PLANS[plan];
  const period = req.nextUrl.searchParams.get("period") === "monthly" ? "monthly" : "yearly";
  const amount = period === "yearly" ? planData.yearlyAmount : planData.monthlyAmount;
  const periodLabel = period === "yearly" ? "연간 구독" : "월간 구독";
  const periodSuffix = period === "yearly" ? "/년" : "/월";

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  const customerEmail = req.nextUrl.searchParams.get("email") || "";
  const customerName = req.nextUrl.searchParams.get("name") || "";
  const origin = req.nextUrl.origin;

  // JS 인라인에 안전하게 삽입하기 위해 JSON.stringify 사용
  const safeClientKey = JSON.stringify(clientKey);
  const safeUserId = JSON.stringify(userId);
  const safeEmail = JSON.stringify(customerEmail);
  const safeName = JSON.stringify(customerName);
  const safeSuccessUrl = JSON.stringify(`${origin}/api/toss/billing/confirm?plan=${plan}&period=${period}`);
  const safeFailUrl = JSON.stringify(`${origin}/pricing?error=billing`);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>카드 등록 - ${planData.orderName} (${period === "yearly" ? "연간" : "월간"})</title>
  <script src="https://js.tosspayments.com/v2/standard"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #fff; border-radius: 16px; padding: 32px 24px; max-width: 420px; width: 100%; color: #333; }
    .plan { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px; background: #f7f8f9; border-radius: 12px; }
    .plan-name { font-size: 14px; color: #666; }
    .plan-price { font-size: 20px; font-weight: 700; }
    .plan-period { font-size: 12px; color: #999; }
    .btn { width: 100%; padding: 16px; background: #3182F6; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #1b6ef3; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; color: #dc2626; font-size: 14px; margin-bottom: 16px; display: none; }
    .info { font-size: 12px; color: #999; text-align: center; margin-top: 12px; }
    .back { display: inline-flex; align-items: center; gap: 4px; color: #666; font-size: 14px; text-decoration: none; margin-bottom: 24px; }
    .back:hover { color: #fff; }
  </style>
</head>
<body>
  <div>
    <a class="back" href="${origin}/payment?plan=${plan}">&larr; 결제수단 선택으로 돌아가기</a>
    <div class="card">
      <div class="plan">
        <div>
          <div class="plan-name">${planData.orderName} (${period === "yearly" ? "연간" : "월간"})</div>
          <div class="plan-period">${periodLabel} · 언제든 취소 가능</div>
        </div>
        <div style="text-align:right">
          <div class="plan-price">₩${amount.toLocaleString()}</div>
          <div class="plan-period">${periodSuffix}</div>
        </div>
      </div>
      <div class="error" id="error"></div>
      <button class="btn" id="pay-btn" onclick="requestBilling()">
        카드 등록 후 ₩${amount.toLocaleString()} 결제
      </button>
      <div class="info">언제든지 해지 가능</div>
    </div>
  </div>

  <script>
    // 토스페이먼츠 v2 SDK 초기화 (공식 가이드와 동일)
    var clientKey = ${safeClientKey};
    var customerKey = ${safeUserId};
    var tossPayments = TossPayments(clientKey.trim());
    var payment = tossPayments.payment({ customerKey: customerKey.trim() });

    function requestBilling() {
      var errorEl = document.getElementById("error");
      errorEl.style.display = "none";

      payment.requestBillingAuth({
        method: "CARD",
        successUrl: ${safeSuccessUrl},
        failUrl: ${safeFailUrl},
        customerEmail: ${safeEmail},
        customerName: ${safeName},
      }).catch(function(e) {
        errorEl.textContent = "결제 오류 [" + (e.code || "UNKNOWN") + "]: " + (e.message || "에러 발생");
        errorEl.style.display = "block";
        console.error("[Toss]", e);
      });
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
