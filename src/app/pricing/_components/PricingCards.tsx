"use client";

import { useState } from "react";
import PricingButton from "./PricingButtons";

type Feature = { text: string; disabled?: boolean; comingSoon?: boolean };

type PlanData = {
  name: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number; // 연간 월 환산
  yearlyTotal: number;
  desc: string;
  color: string;
  badge: string | null;
  usage: { text: string }[];
  features: Feature[];
  cta: string;
  ctaStyle: string;
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
    color: "border-gray-800",
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
    ctaStyle: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
    planKey: "free",
  },
  {
    name: "Starter",
    monthlyPrice: 19000,
    yearlyMonthlyPrice: 15000,
    yearlyTotal: 180000,
    desc: "주 2~3회 키워드를 분석하는 크리에이터",
    color: "border-gray-600",
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
    ctaStyle: "bg-gray-700 hover:bg-gray-600 text-white",
    planKey: "starter",
  },
  {
    name: "Pro",
    monthlyPrice: 45000,
    yearlyMonthlyPrice: 39000,
    yearlyTotal: 468000,
    desc: "매일 트렌드를 선점하는 전문 크리에이터",
    color: "border-teal-500",
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
    ctaStyle: "bg-teal-500 hover:bg-teal-400 text-white",
    planKey: "pro",
  },
  {
    name: "TEAM BIBL",
    monthlyPrice: 490000,
    yearlyMonthlyPrice: 490000,
    yearlyTotal: 5880000,
    desc: "1:1 유튜브 비즈니스 컨설팅",
    color: "border-purple-600",
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
    ctaStyle: "bg-purple-600 hover:bg-purple-500 text-white",
    planKey: "business",
    monthlyOnly: true,
    externalUrl: "https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/eLjQa",
  },
];

function formatPrice(amount: number): string {
  if (amount === 0) return "₩0";
  return `₩${amount.toLocaleString()}`;
}

export default function PricingCards() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <>
      {/* 월간/연간 토글 (탭 스타일) */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-900 border border-gray-700 rounded-full p-1">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              !isYearly
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              isYearly
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            연간
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              isYearly
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/40"
                : "bg-gray-800 text-gray-500"
            }`}>
              최대 21% 할인
            </span>
          </button>
        </div>
      </div>

      {/* 요금제 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const isFree = plan.planKey === "free";
          // 월간 전용 플랜은 토글과 무관하게 항상 월간 가격
          const showYearly = isYearly && !plan.monthlyOnly;
          const price = isFree
            ? 0
            : showYearly
              ? plan.yearlyMonthlyPrice
              : plan.monthlyPrice;
          const period = isFree ? "" : "/ 월";

          return (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-gray-900 border-2 ${plan.color} rounded-2xl p-5`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className="text-xs text-gray-500 font-medium mb-1">{plan.desc}</div>
                <div className="text-lg font-bold text-white mb-2">{plan.name}</div>
                {/* 연간: 월간 원가 취소선 */}
                {!isFree && showYearly && (
                  <div className="text-lg text-gray-600 line-through">
                    {formatPrice(plan.monthlyPrice)}
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-white">{formatPrice(price)}</span>
                  {period && <span className="text-gray-500 text-xs">{period}</span>}
                </div>
                {/* 연간: 절약 금액 */}
                {!isFree && showYearly && (
                  <div className="text-xs text-teal-400 mt-1">
                    월간 대비 {formatPrice((plan.monthlyPrice - plan.yearlyMonthlyPrice) * 12)} 절약
                  </div>
                )}
                {/* 월간 전용 안내 */}
                {plan.monthlyOnly && (
                  <div className="text-xs text-gray-500 mt-1">월간 결제만 제공됩니다</div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">사용량</div>
                <ul className="space-y-1.5">
                  {plan.usage.map((u) => (
                    <li key={u.text} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-teal-400 shrink-0">✓</span>
                      {u.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 mb-6">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">기능</div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-center gap-2 text-sm ${f.disabled ? "text-gray-600 line-through" : "text-gray-300"}`}>
                      <span className={`shrink-0 ${f.disabled ? "text-gray-700" : "text-teal-400"}`}>
                        {f.disabled ? "✕" : "✓"}
                      </span>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        {f.text}
                        {f.comingSoon && (
                          <span className="text-[10px] bg-gray-800 border border-gray-700 text-gray-500 px-1.5 py-0.5 rounded-full leading-none">준비중</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.externalUrl ? (
                <a
                  href={plan.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-2.5 rounded-xl font-semibold text-center text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </a>
              ) : (
                <PricingButton
                  plan={plan.planKey}
                  cta={plan.cta}
                  ctaStyle={plan.ctaStyle}
                  period={isFree ? undefined : (isYearly ? "yearly" : "monthly")}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
