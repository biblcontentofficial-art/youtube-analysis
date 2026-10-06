import { auth, currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSearchUsage } from "@/lib/searchLimit";
import { getChannelUsage } from "@/lib/channelLimit";
import { getPayments, getSubscription } from "@/lib/db";
import { PLANS, type PlanKey } from "@/lib/stripe";
import LogoutButton from "./_components/LogoutButton";
import RecentSearches from "./_components/RecentSearches";
import CancelSubscriptionButton from "./_components/CancelSubscriptionButton";
import DeleteAccountButton from "./_components/DeleteAccountButton";
import ReferralSection from "./_components/ReferralSection";

export default async function MyPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const plan = (user?.plan as string) || "free";

  let usage = { used: 0, limit: 3, isMonthly: false, unlimited: false };
  try {
    usage = await getSearchUsage();
  } catch {}

  let chUsage = { used: 0, limit: 1, unlimited: false, isDaily: true };
  try {
    const cu = await getChannelUsage();
    chUsage = { used: cu.used, limit: cu.limit, unlimited: cu.unlimited, isDaily: cu.isDaily };
  } catch {}

  const [payments, subscription] = await Promise.all([
    getPayments(userId).catch(() => []),
    getSubscription(userId).catch(() => null),
  ]);

  // 플랜 이름은 PLANS 한 곳에서 (team '팀비블', admin 'Admin'). 모르는 키는 그대로 보여 준다.
  const planName = Object.hasOwn(PLANS, plan) ? PLANS[plan as PlanKey].name : plan;

  const planColors: Record<string, string> = {
    free: "text-neutral-400",
    starter: "text-blue-400",
    pro: "text-white",
    business: "text-purple-400",
    team: "text-white",
    admin: "text-white",
  };

  // 구독 상태를 그대로 보여 준다: active 는 자동 갱신, cancelled 는 해지됨(결제 기간 끝까지 이용).
  const subStatus = subscription?.status;

  const displayName = user?.firstName || user?.email?.split("@")[0] || "사용자";
  const email = user?.email || "";

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/search" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black border border-neutral-700 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-white">bibl</span>
              <span className="text-neutral-400"> lab</span>
            </span>
          </Link>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 space-y-6">
          <h1 className="text-xl font-bold text-white text-center">마이페이지</h1>

          {searchParams.payment === 'success' && (
            <div className="border border-green-400/30 rounded-xl p-4 text-center">
              <p className="text-green-400 font-semibold text-sm">구독이 시작됐습니다!</p>
              <p className="text-neutral-400 text-xs mt-1">이제 더 많은 검색을 즐기세요.</p>
            </div>
          )}

          {/* 유저 정보 */}
          <div className="bg-neutral-800/50 rounded-xl p-4 overflow-hidden">
            <p className="text-white font-semibold text-base truncate">{displayName}</p>
            {email && <p className="text-neutral-400 text-sm mt-0.5 truncate">{email}</p>}
          </div>

          {/* 현재 플랜 */}
          <div className="bg-neutral-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-neutral-400 text-xs mb-1">현재 플랜</p>
              <p className={`font-bold text-lg ${planColors[plan] || "text-neutral-400"}`}>
                {planName}
              </p>
            </div>
            {plan === "free" && (
              <Link
                href="/pricing"
                className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                업그레이드
              </Link>
            )}
          </div>
          {plan !== "free" && (
            <div className="text-xs text-neutral-400 mt-1">
              {plan === 'starter' && '월 50회 검색 · 결과 100건'}
              {plan === 'pro' && '월 500회 검색 · 결과 500건'}
              {plan === 'business' && '무제한 검색 · 결과 무제한'}
            </div>
          )}

          {/* 검색 사용량 */}
          <div className="bg-neutral-800/50 rounded-xl p-4">
            <p className="text-neutral-400 text-xs mb-2">
              {usage.isMonthly ? "이번달 영상 검색" : "오늘 영상 검색"}
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-lg">
                {usage.unlimited ? `${usage.used}회 사용` : `${usage.used} / ${usage.limit}회`}
              </span>
              <span className="text-neutral-400 text-xs">
                {usage.unlimited ? "무제한" : usage.isMonthly ? "매월 1일 리셋" : "매일 09:00 (KST) 리셋"}
              </span>
            </div>
            {!usage.unlimited && (
              <div className="w-full bg-neutral-700 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all"
                  style={{ width: `${usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0}%` }}
                />
              </div>
            )}
          </div>

          {/* 채널 검색 사용량 */}
          <div className="bg-neutral-800/50 rounded-xl p-4">
            <p className="text-neutral-400 text-xs mb-2">{chUsage.isDaily ? "오늘 채널 검색" : "이번달 채널 검색"}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-lg">
                {chUsage.unlimited ? `${chUsage.used}회 사용` : `${chUsage.used} / ${chUsage.limit}회`}
              </span>
              <span className="text-neutral-400 text-xs">
                {chUsage.unlimited ? "무제한" : chUsage.isDaily ? "매일 자정 리셋" : "매월 1일 리셋"}
              </span>
            </div>
            {!chUsage.unlimited && (
              <div className="w-full bg-neutral-700 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${chUsage.limit > 0 ? Math.min((chUsage.used / chUsage.limit) * 100, 100) : 0}%` }}
                />
              </div>
            )}
          </div>

          {/* 다음 결제일(자동 갱신 중) · 이용 종료 예정일(해지됨) */}
          {subscription?.next_billing_at && plan !== "free" && (subStatus === "active" || subStatus === "cancelled") && (
            <div className="bg-neutral-800/50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-neutral-400 text-xs mb-1">
                  {subStatus === "cancelled" ? "이용 종료 예정일" : "다음 결제일"}
                </p>
                <p className="text-white font-semibold text-sm whitespace-nowrap">
                  {new Date(subscription.next_billing_at).toLocaleDateString("ko-KR", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
              <span className="text-xs text-neutral-400 text-right break-keep">
                {subStatus === "cancelled" ? "해지됨 · 자동 갱신 안 함" : "자동 갱신"}
              </span>
            </div>
          )}

          {/* 결제 내역 */}
          {payments.length > 0 && (
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <p className="text-neutral-400 text-xs mb-3">결제 내역</p>
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-neutral-300 capitalize">{p.plan}</span>
                      <span className="text-neutral-400 text-xs ml-2">{p.paid_at?.slice(0, 10)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">₩{p.amount.toLocaleString()}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        p.status === "success" ? "bg-green-900/50 text-green-400" :
                        p.status === "cancelled" ? "bg-neutral-800 text-neutral-400" :
                        "bg-red-900/50 text-red-400"
                      }`}>
                        {p.status === "success" ? "완료" : p.status === "cancelled" ? "취소" : "실패"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 친구 초대 */}
          <ReferralSection />

          {/* 최근 검색 키워드 */}
          <RecentSearches />

          {/* 검색 바로가기 */}
          <Link
            href="/search"
            className="w-full flex items-center justify-center py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition text-sm font-medium"
          >
            검색으로 이동
          </Link>

          {/* 로그아웃 */}
          <LogoutButton />

          {/* 구독 취소: 버튼은 자동 갱신 중인 구독에만 보인다(해지된 구독, 결제 없는 팀비블·Admin 은 없음).
              해지된 구독에도 자리를 두는 것은, 이 화면에서 취소한 직후 다시 그려질 때 취소 안내가 사라지지 않게 하려는 것 */}
          {(subStatus === "active" || subStatus === "cancelled") && (
            <CancelSubscriptionButton cancelled={subStatus === "cancelled"} />
          )}

          {/* 계정 삭제 */}
          <DeleteAccountButton />
        </div>
      </div>
    </main>
  );
}
