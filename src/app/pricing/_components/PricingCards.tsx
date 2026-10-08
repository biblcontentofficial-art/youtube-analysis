"use client";

/**
 * 요금제 카드 4장 + 월간/연간 세그먼트(DESIGN 7.3 요금제, 6.6 세그먼트, 6.7 카드·추천 카드, 6.12 solid 배지).
 * - 카드는 surface 면 + line 선. 추천(Pro)만 surface-2 + line-hover + 흰 주 버튼 + 흰 '추천' 배지(결정 G 기본 B).
 *   나머지 CTA 는 보조 버튼. 흰 면 버튼은 이 폴드에 하나다.
 * - 1024 이상은 카드 다섯 칸(머리·가격·사용량·기능·CTA)을 subgrid 로 묶어 같은 줄 높이에 둔다.
 *   가격 칸은 해당 없는 줄도 invisible 로 자리를 지켜 토글을 바꿔도 높이가 같다(아래 비교표·FAQ 가 밀리지 않는다).
 * - 로그인 여부는 여기서 한 번 확인해 버튼에 내려 주고, 로그인했으면 /api/usage 를 한 번 읽어 현재 플랜 CTA 를
 *   '현재 플랜'(비활성)으로 바꾼다. /api/usage 는 표시용이다. 결제 진입 조건으로 쓰지 않는다.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import PricingButton from "./PricingButtons";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { buttonClass, cx } from "@/components/ui/button";
import { CARD, CARD_FEATURED } from "@/components/ui/card";
import { SEGMENT, SEGMENT_ITEM } from "@/components/ui/chip";
import { badgeClass } from "@/components/ui/badge";
import { CheckIcon, CloseIcon, ExternalLinkIcon } from "@/components/ui/icons";

type Feature = { text: string; disabled?: boolean; comingSoon?: boolean };

type PlanData = {
  name: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number; // 연간 월 환산
  yearlyTotal: number;
  desc: string;
  featured?: boolean;
  badge: string | null;
  usage: { text: string }[];
  features: Feature[];
  cta: string;
  planKey: string;
  monthlyOnly?: boolean; // true면 연간 옵션 없이 월간 가격만 표시
  externalUrl?: string; // 있으면 자체 결제 대신 외부 링크로 이동
};

const PLANS: PlanData[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlyTotal: 0,
    desc: "처음 시작하는 크리에이터",
    badge: null,
    usage: [
      { text: "영상 검색 2회/일" },
      { text: "채널 검색 1회/일" },
    ],
    features: [
      { text: "조회수·구독자·게시일 한눈에 보기" },
      { text: "기본 필터 (전체/쇼츠)" },
      { text: "키워드 경쟁도 · 제목 패턴 분석", disabled: true },
      { text: "검색 기록 저장", disabled: true },
      { text: "영상 수집 · 내보내기", disabled: true },
    ],
    cta: "무료로 시작",
    planKey: "free",
  },
  {
    name: "Starter",
    monthlyPrice: 19000,
    yearlyMonthlyPrice: 15000,
    yearlyTotal: 180000,
    desc: "주 2~3회 키워드를 분석하는 크리에이터",
    badge: null,
    usage: [
      { text: "영상 검색 50회/월" },
      { text: "채널 검색 30회/월" },
    ],
    features: [
      { text: "조회수·구독자·게시일 한눈에 보기" },
      { text: "키워드 경쟁도 · 제목 패턴 분석" },
      { text: "쇼츠 필터 · 심화 필터" },
      { text: "검색 기록 30일 저장" },
      { text: "영상 수집 · 내보내기", disabled: true },
      { text: "팀 공유", disabled: true },
    ],
    cta: "Starter 시작하기",
    planKey: "starter",
  },
  {
    name: "Pro",
    monthlyPrice: 45000,
    yearlyMonthlyPrice: 39000,
    yearlyTotal: 468000,
    desc: "매일 트렌드를 선점하는 전문 크리에이터",
    featured: true,
    badge: "추천",
    usage: [
      { text: "영상 검색 500회/월" },
      { text: "채널 검색 500회/월" },
    ],
    features: [
      { text: "조회수·구독자·게시일 한눈에 보기" },
      { text: "키워드 경쟁도 · 제목 패턴 분석" },
      { text: "쇼츠 필터 · 심화 필터" },
      { text: "검색 기록 무제한 저장" },
      { text: "영상 수집 · CSV 내보내기" },
      { text: "채널 분석 리포트" },
      { text: "팀 공유", disabled: true },
    ],
    cta: "Pro 시작하기",
    planKey: "pro",
  },
  {
    name: "TEAM BIBL",
    monthlyPrice: 490000,
    yearlyMonthlyPrice: 490000,
    yearlyTotal: 5880000,
    desc: "1:1 유튜브 비즈니스 컨설팅",
    badge: null,
    usage: [
      { text: "영상 검색 무제한" },
      { text: "채널 검색 무제한" },
    ],
    features: [
      { text: "Pro의 모든 기능 포함" },
      { text: "매주 1회 1:1 비블 컨설팅" },
      { text: "100강 VOD 제공" },
      { text: "매월 비블 오프라인 커뮤니티 초대권" },
    ],
    cta: "TEAM BIBL 시작하기",
    planKey: "business",
    monthlyOnly: true,
    externalUrl: "https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/eLjQa",
  },
];

function formatPrice(amount: number): string {
  if (amount === 0) return "₩0";
  return `₩${amount.toLocaleString()}`;
}

/** 가격 칸의 한 줄. 해당 없으면 모바일에서는 빼고, 1024 이상에서는 자리만 지킨다(카드 줄 맞춤·토글 밀림 0) */
function Slot({ show, className, children }: { show: boolean; className: string; children: React.ReactNode }) {
  return show ? (
    <p className={className}>{children}</p>
  ) : (
    <p aria-hidden="true" className={cx(className, "invisible max-lg:hidden")}>
      {children}
    </p>
  );
}

/** 카드 안 작은 머리(사용량·기능). 12px 글자는 fg-3 이상 */
const GROUP_LABEL = "mb-2.5 text-micro font-semibold text-fg-3";

/** 현재 플랜 표시(누를 수 없음). 흰 면을 쓰지 않는다 */
const CURRENT_PLAN =
  "inline-flex h-12 w-full items-center justify-center rounded-control border border-line bg-surface text-ui font-semibold text-fg-3";

export default function PricingCards({
  fixedPlan,
}: {
  /** 고정 화면(ux-preview) 전용: 로그인한 이 플랜 사용자로 그리고 인증·API 를 부르지 않는다 */
  fixedPlan?: string;
} = {}) {
  const [isYearly, setIsYearly] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(fixedPlan ? true : null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(fixedPlan ?? null);

  // 인증 확인 1회 + (로그인했으면) 남은 횟수 API 1회. 실패하면 표시만 생략한다
  useEffect(() => {
    if (fixedPlan) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await createSupabaseBrowser().auth.getUser();
        if (!alive) return;
        const isIn = !!data.user;
        setSignedIn(isIn);
        if (!isIn) return;
        const res = await fetch("/api/usage");
        if (!res.ok) return;
        const usage = (await res.json()) as { plan?: string };
        if (alive && typeof usage.plan === "string") setCurrentPlan(usage.plan);
      } catch {
        // 표시용이라 조용히 넘긴다(버튼은 누를 때 다시 확인한다)
      }
    })();
    return () => {
      alive = false;
    };
  }, [fixedPlan]);

  return (
    <>
      {/* 월간/연간 세그먼트 */}
      <div className="mt-10 md:mt-12">
        <div role="group" aria-label="결제 주기" className={SEGMENT}>
          <button
            type="button"
            aria-pressed={!isYearly}
            onClick={() => setIsYearly(false)}
            className={SEGMENT_ITEM}
          >
            월간
          </button>
          <button
            type="button"
            aria-pressed={isYearly}
            onClick={() => setIsYearly(true)}
            className={cx(SEGMENT_ITEM, "gap-2")}
          >
            연간
            <span className="text-micro font-semibold text-silver">최대 21% 할인</span>
          </button>
        </div>
      </div>

      {/* 요금제 카드. 제목 단계(h1 → h2 → 카드 h3)를 맞추는 보이지 않는 묶음 제목 */}
      <h2 className="sr-only">플랜</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3 xl:gap-6">
        {PLANS.map((plan) => {
          const isFree = plan.planKey === "free";
          // 월간 전용 플랜은 토글과 무관하게 항상 월간 가격
          const showYearly = isYearly && !plan.monthlyOnly;
          const price = isFree ? 0 : showYearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
          const isCurrent = signedIn === true && currentPlan === plan.planKey;
          const ctaClass = buttonClass({
            variant: plan.featured ? "primary" : "secondary",
            size: "lg",
            block: true,
          });

          return (
            <section
              key={plan.name}
              aria-labelledby={`plan-${plan.planKey}`}
              className={cx(
                plan.featured ? CARD_FEATURED : CARD,
                "flex flex-col p-5 sm:p-6 lg:row-span-5 lg:grid lg:grid-rows-subgrid lg:gap-y-0 lg:p-4 xl:p-6",
              )}
            >
              {/* 머리: 1024 이상은 칸 아래에 붙여 설명 줄 수가 달라도 플랜 이름 줄을 맞춘다 */}
              <div className="lg:flex lg:flex-col lg:justify-end">
                <p className="text-caption text-fg-3">{plan.desc}</p>
                <div className="mt-1 flex items-center gap-2">
                  <h3 id={`plan-${plan.planKey}`} className="text-h4 font-extrabold text-fg">
                    {plan.name}
                  </h3>
                  {plan.badge && <span className={badgeClass("solid")}>{plan.badge}</span>}
                </div>
              </div>

              {/* 가격 */}
              <div className="mt-4">
                <Slot show={!isFree && showYearly} className="tnum text-body text-fg-3 line-through">
                  <span className="sr-only">정가 </span>
                  {formatPrice(plan.monthlyPrice)}
                </Slot>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="tnum text-[40px] font-extrabold leading-[1.15] tracking-[-0.03em] text-fg md:text-[48px] lg:text-[40px] lg:max-xl:tracking-[-0.04em]">
                    {formatPrice(price)}
                  </span>
                  {/* 1024~1279 는 4열 카드 폭이 좁아 '/ 월'을 모든 카드에서 같은 다음 줄로 내린다(가격 40px 유지, 모양 통일) */}
                  {!isFree && <span className="text-body-sm text-fg-3 lg:max-xl:basis-full">/ 월</span>}
                </p>
                <Slot show={!isFree} className="tnum mt-1 text-body-sm font-medium text-fg-2">
                  {showYearly ? `연 ${formatPrice(plan.yearlyTotal)} 결제` : "매월 결제"}
                </Slot>
                <Slot
                  show={(!isFree && showYearly) || !!plan.monthlyOnly}
                  className={cx("tnum mt-0.5 text-caption", plan.monthlyOnly ? "text-fg-3" : "text-silver")}
                >
                  {plan.monthlyOnly
                    ? "월간 결제만 제공됩니다"
                    : `월간 대비 ${formatPrice((plan.monthlyPrice - plan.yearlyMonthlyPrice) * 12)} 절약`}
                </Slot>
              </div>

              {/* 사용량 */}
              <div className="mt-6 border-t border-line pt-5">
                <p className={GROUP_LABEL}>사용량</p>
                <ul className="space-y-2">
                  {plan.usage.map((u) => (
                    <li key={u.text} className="flex items-start gap-2 text-body-sm text-fg-1">
                      <CheckIcon size={16} className="mt-[3px] text-fg-2" />
                      {u.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 기능 */}
              <div className="mt-6 flex-1 pb-6 lg:flex-none">
                <p className={GROUP_LABEL}>기능</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className={cx(
                        "items-start gap-2 text-body-sm",
                        f.disabled ? "hidden text-fg-3 sm:flex" : "flex text-fg-2",
                      )}
                    >
                      {f.disabled ? (
                        <CloseIcon size={16} className="mt-[3px] text-fg-4" />
                      ) : (
                        <CheckIcon size={16} className="mt-[3px] text-fg-2" />
                      )}
                      <span className="flex flex-wrap items-center gap-1.5">
                        {f.disabled && <span className="sr-only">미포함: </span>}
                        {f.text}
                        {f.comingSoon && <span className={badgeClass()}>준비중</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div>
                {isCurrent ? (
                  <button type="button" disabled className={CURRENT_PLAN}>
                    현재 플랜
                  </button>
                ) : plan.externalUrl ? (
                  <>
                    <a href={plan.externalUrl} target="_blank" rel="noopener noreferrer" className={ctaClass}>
                      {plan.cta}
                      <span className="sr-only"> (새 창)</span>
                    </a>
                    <p className="mt-2 flex items-center justify-center gap-1 text-caption text-fg-3">
                      신청 페이지로 이동합니다
                      <ExternalLinkIcon size={16} />
                    </p>
                  </>
                ) : (
                  <PricingButton
                    plan={plan.planKey}
                    cta={plan.cta}
                    className={ctaClass}
                    signedIn={signedIn}
                    period={isFree ? undefined : isYearly ? "yearly" : "monthly"}
                  />
                )}
                {plan.externalUrl && (
                  <div className="mt-1 flex justify-center">
                    <Link
                      href="/studio/class/consulting"
                      className="inline-flex h-11 items-center gap-1.5 text-body-sm font-semibold text-fg transition-colors duration-150 hover:text-fg-2"
                    >
                      컨설팅 안내 보기 <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
