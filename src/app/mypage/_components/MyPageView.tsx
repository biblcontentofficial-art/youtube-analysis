/**
 * 마이페이지 화면(데이터 조회 없음). page.tsx 가 서버에서 읽은 값을 넘기고,
 * 로컬 미리보기(/ux-preview/r01-mypage)가 고정 데이터로 같은 화면을 그린다.
 * 근거: DESIGN.md 7.3 마이페이지 · 6.4 섹션 헤더 · 6.7 앱 카드 · 6.12 배지 · 6.13 상태 메시지 · 6.23 사용량 막대
 *
 * 섹션: PLAN(플랜·남은 횟수·결제) · USAGE(영상·채널 검색 사용량, 최근 검색) · INVITE(친구 초대) · ACCOUNT(계정·로그아웃·구독 취소)
 * 계정 삭제는 ACCOUNT 카드 아래에 따로 negative 글자 버튼으로 둔다.
 * 제목 단계: h1 마이페이지 → 섹션 캡션(role=heading level 2, SectionHeader 가 span 으로 감싸므로) → 카드 제목 h3.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import type { Payment, Subscription } from "@/lib/db";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClass, cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";

/** 앱 카드(DESIGN 6.7). 카드 안에 카드를 두지 않는다 */
const APP_CARD = "rounded-card border border-line bg-surface p-5 md:p-6";

/** 섹션 헤더 간격(앱 화면이라 마케팅 기본 40/48px 보다 좁게) */
const SECTION_HEAD = "mb-4! md:mb-5!";

/** 남은 횟수 문구 색: 평소 fg-2 · 5회 이하 caution · 0회 negative (DESIGN 3.1, 네비 배지와 같은 기준) */
function remainingTone(remaining: number) {
  if (remaining === 0) return "text-negative";
  if (remaining <= 5) return "text-caution";
  return "text-fg-2";
}

function planLabel(key: string) {
  return Object.hasOwn(PLANS, key) ? PLANS[key as PlanKey].name : key;
}

type SearchUsage = { used: number; limit: number; isMonthly: boolean; unlimited: boolean };
type ChannelUsage = { used: number; limit: number; unlimited: boolean; isDaily: boolean };

/** 사용량 막대(DESIGN 6.23): 트랙 surface-3, 채움 chart-1, 5회 이하 남음 caution, 소진 negative */
function UsageMeter({
  title,
  used,
  limit,
  unlimited,
  reset,
}: {
  title: string;
  used: number;
  limit: number;
  unlimited: boolean;
  reset: string;
}) {
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const fill = remaining === 0 ? "bg-negative" : remaining <= 5 ? "bg-caution" : "bg-chart-1";
  return (
    <div className={APP_CARD}>
      {/* 제목은 한 줄, 리셋 안내는 좁은 폭에서 오른쪽에서 줄바꿈(320 재배치) */}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="shrink-0 whitespace-nowrap text-body-sm font-semibold text-fg-2">{title}</h3>
        <span className="min-w-0 text-right text-caption text-fg-3 break-keep">{reset}</span>
      </div>
      <p className="tnum mt-3 text-h4 font-extrabold text-fg">
        {unlimited ? `${used}회 사용` : `${used} / ${limit}회`}
      </p>
      {!unlimited && (
        <div
          role="progressbar"
          aria-label={`${title} 사용량`}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(used, limit)}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        >
          <div className={cx("h-full", fill)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function MyPageView({
  paymentSuccess,
  user,
  plan,
  usage,
  chUsage,
  payments,
  subscription,
  referral,
  recentSearches,
  logout,
  renderCancel,
  renderDelete,
}: {
  paymentSuccess: boolean;
  user: { firstName?: string | null; email?: string | null } | null;
  plan: string;
  usage: SearchUsage;
  chUsage: ChannelUsage;
  payments: Payment[];
  subscription: Subscription | null;
  /** 친구 초대 카드 */
  referral: ReactNode;
  /** 최근 검색 키워드 카드 */
  recentSearches: ReactNode;
  logout: ReactNode;
  /** 구독 취소 버튼(cancelled 면 해지된 구독) */
  renderCancel: (cancelled: boolean) => ReactNode;
  /** 계정 삭제 버튼(hasSubscription 이면 삭제 대상에 구독 해지를 함께 적는다) */
  renderDelete: (hasSubscription: boolean) => ReactNode;
}) {
  // 플랜 이름은 PLANS 한 곳에서 (team '팀비블', admin 'Admin'). 모르는 키는 그대로 보여 준다.
  const planName = planLabel(plan);

  const planDesc =
    plan === "starter"
      ? "월 50회 검색 · 결과 100건"
      : plan === "pro"
      ? "월 500회 검색 · 결과 500건"
      : plan === "business"
      ? "무제한 검색 · 결과 무제한"
      : null;

  // 구독 상태를 그대로 보여 준다: active 는 자동 갱신, cancelled 는 해지됨(결제 기간 끝까지 이용).
  const subStatus = subscription?.status;
  const hasSubRow = subStatus === "active" || subStatus === "cancelled";
  const showBilling = !!subscription?.next_billing_at && plan !== "free" && hasSubRow;

  const displayName = user?.firstName || user?.email?.split("@")[0] || "사용자";
  const email = user?.email || "";

  // 남은 횟수: 네비 배지(SearchUsageBadge)와 같은 값(limit - used)
  const remaining = Math.max(0, usage.limit - usage.used);
  const isOut = !usage.unlimited && remaining === 0;

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-h3 text-fg">마이페이지</h1>

        {paymentSuccess && (
          <div role="status" className="mt-6 flex gap-3 rounded-card border border-line bg-surface p-4">
            <CheckIcon className="mt-0.5 text-positive" />
            <div className="min-w-0">
              <p className="text-ui font-semibold text-positive">구독이 시작됐습니다!</p>
              <p className="mt-0.5 text-body-sm text-fg-3">이제 더 많은 검색을 즐기세요.</p>
            </div>
          </div>
        )}

        {/* PLAN: 현재 플랜 · 남은 횟수 · 결제 */}
        <section aria-labelledby="mypage-plan" className="mt-8 md:mt-10">
          <SectionHeader caption={<span id="mypage-plan" role="heading" aria-level={2}>플랜과 결제</span>} label="PLAN" className={SECTION_HEAD} />
          <div className="space-y-3 md:space-y-4">
            <div className={cx(APP_CARD, "grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end")}>
              <div className="min-w-0">
                <p className="text-caption text-fg-3">현재 플랜</p>
                <p className="mt-1 text-h4 font-extrabold text-fg">{planName}</p>
                {planDesc && <p className="mt-1 text-body-sm text-fg-3">{planDesc}</p>}
                {plan === "free" && (
                  <Link href="/pricing" className={cx(buttonClass(), "mt-5")}>
                    업그레이드
                  </Link>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-caption text-fg-3">{usage.isMonthly ? "이번달 영상 검색" : "오늘 영상 검색"}</p>
                {usage.unlimited ? (
                  <p className="mt-1 text-[40px] font-extrabold leading-none tracking-[-0.03em] text-fg-2">무제한</p>
                ) : (
                  <>
                    <p
                      aria-hidden="true"
                      className={cx(
                        "tnum mt-1 text-[40px] font-extrabold leading-none tracking-[-0.03em]",
                        remainingTone(remaining),
                      )}
                    >
                      {remaining}
                      <span className="ml-1 text-h4 font-bold">회 남음</span>
                    </p>
                    <p className="sr-only">
                      {isOut ? "영상 검색 한도 초과" : `영상 검색 ${remaining}회 남음`}
                    </p>
                    {isOut && (
                      <p aria-hidden="true" className="mt-2 text-body-sm font-semibold text-negative">
                        한도 초과
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {(showBilling || payments.length > 0) && (
              <div className={APP_CARD}>
                {/* 다음 결제일(자동 갱신 중) · 이용 종료 예정일(해지됨) */}
                {showBilling && subscription?.next_billing_at && (
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <div>
                      <p className="text-caption text-fg-3">
                        {subStatus === "cancelled" ? "이용 종료 예정일" : "다음 결제일"}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-ui font-semibold text-fg">
                        {new Date(subscription.next_billing_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={badgeClass("neutral")}>
                      {subStatus === "cancelled" ? "해지됨 · 자동 갱신 안 함" : "자동 갱신"}
                    </span>
                  </div>
                )}

                {/* 결제 내역 */}
                {payments.length > 0 && (
                  <div className={cx(showBilling && "mt-5 border-t border-line pt-5")}>
                    <h3 className="text-caption text-fg-3">결제 내역</h3>
                    <ul className="mt-2 divide-y divide-line-soft">
                      {payments.slice(0, 5).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-body-sm">
                          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                            <span className="text-fg-2">{planLabel(p.plan)}</span>
                            <span className="tnum whitespace-nowrap text-caption text-fg-3">{p.paid_at?.slice(0, 10)}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="tnum font-medium text-fg">₩{p.amount.toLocaleString()}</span>
                            <span
                              className={badgeClass(
                                p.status === "success" ? "success" : p.status === "cancelled" ? "neutral" : "danger",
                              )}
                            >
                              {p.status === "success" ? "완료" : p.status === "cancelled" ? "취소" : "실패"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* USAGE: 영상·채널 검색 사용량, 최근 검색 */}
        <section aria-labelledby="mypage-usage" className="mt-12">
          <SectionHeader caption={<span id="mypage-usage" role="heading" aria-level={2}>검색 사용량</span>} label="USAGE" className={SECTION_HEAD} />
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <UsageMeter
              title={usage.isMonthly ? "이번달 영상 검색" : "오늘 영상 검색"}
              used={usage.used}
              limit={usage.limit}
              unlimited={usage.unlimited}
              reset={usage.unlimited ? "무제한" : usage.isMonthly ? "매월 1일 리셋" : "매일 09:00 (KST) 리셋"}
            />
            <UsageMeter
              title={chUsage.isDaily ? "오늘 채널 검색" : "이번달 채널 검색"}
              used={chUsage.used}
              limit={chUsage.limit}
              unlimited={chUsage.unlimited}
              reset={chUsage.unlimited ? "무제한" : chUsage.isDaily ? "매일 오전 9시(한국 시간) 리셋" : "매월 1일 리셋"}
            />
          </div>
          <div className="mt-3 md:mt-4">{recentSearches}</div>
          <Link
            href="/search"
            className="mt-2 inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors hover:text-fg-2"
          >
            검색으로 이동 <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* INVITE: 친구 초대 */}
        <section aria-labelledby="mypage-invite" className="mt-12">
          <SectionHeader caption={<span id="mypage-invite" role="heading" aria-level={2}>친구 초대</span>} label="INVITE" className={SECTION_HEAD} />
          {referral}
        </section>

        {/* ACCOUNT: 계정 정보 · 로그아웃 · 구독 취소, 그 아래 계정 삭제 */}
        <section aria-labelledby="mypage-account" className="mt-12">
          <SectionHeader caption={<span id="mypage-account" role="heading" aria-level={2}>계정 관리</span>} label="ACCOUNT" className={SECTION_HEAD} />
          <div className={APP_CARD}>
            <p className="truncate text-ui font-semibold text-fg">{displayName}</p>
            {email && <p className="mt-0.5 truncate text-body-sm text-fg-3">{email}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
              {logout}
              {/* 구독 취소: 버튼은 자동 갱신 중인 구독에만 보인다(해지된 구독, 결제 없는 팀비블·Admin 은 없음).
                  해지된 구독에도 자리를 두는 것은, 이 화면에서 취소한 직후 다시 그려질 때 취소 안내가 사라지지 않게 하려는 것 */}
              {hasSubRow && renderCancel(subStatus === "cancelled")}
            </div>
          </div>
          <div className="mt-6">{renderDelete(subStatus === "active")}</div>
        </section>
      </div>
    </main>
  );
}
