import type { Metadata } from "next";
import PricingCards from "./_components/PricingCards";
import FaqAccordion from "./_components/FaqAccordion";

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

// 플랜 데이터는 PricingCards 클라이언트 컴포넌트로 이동

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

        {/* 월간/연간 토글 + 요금제 카드 */}
        <PricingCards />

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
