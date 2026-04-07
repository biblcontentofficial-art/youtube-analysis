import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";
import { PLANS, PlanKey } from "@/lib/payple";
import TossCheckoutWidget from "./_components/TossCheckoutWidget";

export const metadata = {
  robots: { index: false, follow: false },
};

const PLAN_BADGE_COLOR: Record<string, string> = {
  starter: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  pro: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  business: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default async function TossCheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/pricing");

  const plan = searchParams.plan as TossPlanKey;
  if (!plan || !TOSS_PLANS[plan]) redirect("/pricing");

  const user = await currentUser();
  const planData = TOSS_PLANS[plan];
  const planMeta = PLANS[plan as PlanKey];

  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
  // 자동결제(빌링)는 API 개별 연동 키 사용 (결제위젯 키가 아님)
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

  // orderId는 SSR에서 생성 → 중복 방지
  const orderId = `toss_${userId.slice(-8)}_${Date.now().toString(36)}`;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* 뒤로가기 */}
        <Link
          href={`/payment?plan=${plan}`}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          결제수단 선택으로 돌아가기
        </Link>

        {/* 주문 요약 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PLAN_BADGE_COLOR[plan] ?? "bg-gray-700 text-gray-300 border-gray-600"}`}>
                  {planMeta?.name ?? plan}
                </span>
                <span className="text-xs text-gray-500">토스페이먼츠</span>
              </div>
              <p className="text-white font-semibold text-base">월 정기 구독</p>
              <p className="text-gray-500 text-xs mt-0.5">매월 자동 결제 · 언제든 취소 가능</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white font-bold text-xl">
                ₩{planData.amount.toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs">/월</p>
            </div>
          </div>
        </div>

        {/* 토스 자동결제(빌링) 카드 등록 */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <TossCheckoutWidget
            clientKey={clientKey}
            customerKey={userId}
            amount={planData.amount}
            orderId={orderId}
            orderName={planData.orderName}
            customerEmail={userEmail}
            customerName={userName}
            plan={plan}
          />
        </div>

        {/* 안내 */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-xs text-gray-600">결제 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.</p>
        </div>

      </div>
    </div>
  );
}
