import PricingButton from "./_components/PricingButtons";

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
      { text: "실시간 검색 2회/일" },
      { text: "검색 결과 50건" },
    ],
    features: [
      { text: "아웃라이어 · 성과도 확인" },
      { text: "기본 필터 (전체/쇼츠)" },
      { text: "알고리즘 확률 확인", disabled: true },
      { text: "검색 기록 저장", disabled: true },
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
      { text: "실시간 검색 10회/일" },
      { text: "검색 결과 100건" },
    ],
    features: [
      { text: "아웃라이어 · 성과도 확인" },
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
      { text: "실시간 검색 50회/일" },
      { text: "검색 결과 200건" },
    ],
    features: [
      { text: "아웃라이어 · 성과도 확인" },
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
      { text: "실시간 검색 무제한" },
      { text: "검색 결과 200건" },
    ],
    features: [
      { text: "Pro 모든 기능 포함" },
      { text: "팀원 5명 공유", comingSoon: true },
      { text: "주간 트렌드 리포트 이메일", comingSoon: true },
      { text: "채널 심화 분석 리포트" },
      { text: "API 접근", comingSoon: true },
      { text: "전용 고객 지원" },
    ] as Feature[],
    cta: "Business 시작하기",
    ctaStyle: "bg-purple-600 hover:bg-purple-500 text-white",
    planKey: "business",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white py-16 px-4">
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
      </div>
    </main>
  );
}
