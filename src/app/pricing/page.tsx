import type { Metadata } from "next";
import PricingButton from "./_components/PricingButtons";
import FaqAccordion from "./_components/FaqAccordion";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "요금제 · 플랜 안내",
  description:
    "비블랩(bibl lab) 요금제 안내. 무료 Free 플랜부터 Starter·Pro·Business까지. 유튜브 영상 검색, 채널 찾기, 영상 수집·내보내기 기능을 합리적인 가격에 이용하세요.",
  keywords: [
    "비블랩 요금제", "비블 가격", "유튜브 분석 도구 가격", "bibl lab 플랜",
    "유튜브 분석 무료", "크리에이터 도구 요금제",
  ],
  alternates: { canonical: "https://bibllab.com/pricing" },
  openGraph: {
    title: "요금제 · 플랜 안내 | 비블랩",
    description: "비블랩 무료~비즈니스 플랜. 유튜브 분석·채널 찾기·영상 수집.",
    url: "https://bibllab.com/pricing",
  },
};

type Feature = { text: string; disabled?: boolean; comingSoon?: boolean };

const PLANS = [
  {
    name: "Free",
    price: "₩0",
    period: "",
    desc: "처음 시작하는 크리에이터",
    color: "border-gray-800",
    badge: null,
    usage: [
      { text: "영상 검색 2회/일" },
      { text: "채널 검색 1회/일" },
    ],
    features: [
      { text: "아웃라이어 · 반응도 확인" },
      { text: "기본 필터 (전체/쇼츠)" },
      { text: "알고리즘 확률 확인", disabled: true },
      { text: "검색 기록 저장", disabled: true },
      { text: "영상 수집 · 내보내기", disabled: true },
    ] as Feature[],
    cta: "무료로 시작",
    ctaStyle: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
    planKey: "free",
  },
  {
    name: "Starter",
    price: "₩49,000",
    period: "/ 월",
    desc: "주 2~3회 키워드를 분석하는 크리에이터",
    color: "border-gray-600",
    badge: null,
    usage: [
      { text: "영상 검색 50회/월" },
      { text: "채널 검색 30회/월" },
    ],
    features: [
      { text: "아웃라이어 · 반응도 확인" },
      { text: "알고리즘 확률 확인" },
      { text: "쇼츠 필터 · 심화 필터" },
      { text: "검색 기록 30일 저장" },
      { text: "영상 수집 · 내보내기", disabled: true },
      { text: "팀 공유", disabled: true },
    ] as Feature[],
    cta: "Starter 시작하기",
    ctaStyle: "bg-gray-700 hover:bg-gray-600 text-white",
    planKey: "starter",
  },
  {
    name: "Pro",
    price: "₩199,000",
    period: "/ 월",
    desc: "매일 트렌드를 선점하는 전문 크리에이터",
    color: "border-teal-500",
    badge: "추천",
    usage: [
      { text: "영상 검색 500회/월 (팀 최대 2명)" },
      { text: "채널 검색 500회/월" },
    ],
    features: [
      { text: "아웃라이어 · 반응도 확인" },
      { text: "알고리즘 확률 확인" },
      { text: "쇼츠 필터 · 심화 필터" },
      { text: "검색 기록 무제한 저장" },
      { text: "영상 수집 · CSV 내보내기" },
      { text: "채널 분석 리포트" },
      { text: "팀 공유", disabled: true },
    ] as Feature[],
    cta: "Pro 시작하기",
    ctaStyle: "bg-teal-500 hover:bg-teal-400 text-white",
    planKey: "pro",
  },
  {
    name: "Business",
    price: "₩490,000",
    period: "/ 월",
    desc: "마케터 · MCN · 에이전시",
    color: "border-purple-600",
    badge: null,
    usage: [
      { text: "영상 검색 무제한 (팀 최대 5명)" },
      { text: "채널 검색 무제한" },
    ],
    features: [
      { text: "Pro 모든 기능 포함" },
      { text: "채널 심화 분석 리포트" },
      { text: "65만+ 유튜버 비블 월 1회 1시간 미팅" },
    ] as Feature[],
    cta: "Business 시작하기",
    ctaStyle: "bg-purple-600 hover:bg-purple-500 text-white",
    planKey: "business",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white py-16 px-4 pb-24">
      <div className="max-w-6xl mx-auto">

        {/* 헤더 */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center rounded-full border border-teal-800 bg-teal-950/50 px-4 py-1.5 text-sm text-teal-400">
            심플한 요금제
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            원하는 플랜을 선택하세요
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            무료로 시작하고, 필요할 때 업그레이드하세요.<br />
            언제든지 취소 가능합니다.
          </p>
        </div>

        {/* 요금제 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-gray-900 border-2 ${plan.color} rounded-2xl p-5`}
            >
              {/* 추천 배지 */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* 플랜명 + 가격 */}
              <div className="mb-5">
                <div className="text-xs text-gray-500 font-medium mb-1">{plan.desc}</div>
                <div className="text-lg font-bold text-white mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 text-xs">{plan.period}</span>}
                </div>
              </div>

              {/* 사용량 */}
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

              {/* 기능 */}
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

              {/* CTA */}
              <PricingButton
                plan={plan.planKey}
                cta={plan.cta}
                ctaStyle={plan.ctaStyle}
              />
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 text-center text-sm text-gray-600 space-y-2">
          <p>모든 플랜은 카드 결제를 지원합니다.</p>
          <p>구독은 언제든지 취소 가능하며 남은 기간은 환불 처리됩니다.</p>
        </div>

        {/* FAQ */}
        <FaqAccordion />
      </div>
    </main>
  );
}
