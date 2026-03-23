import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "무료 상담 신청 — TMK STUDIO",
  description: "비블과 1:1 채널 진단 상담을 신청하세요. 채널 현황 분석부터 맞춤 전략까지 무료로 안내해 드립니다.",
};

const CONSULTATION_TYPES = [
  {
    icon: "🎬",
    title: "채널 대행",
    desc: "기획부터 편집·업로드·분석까지 전 과정을 TMK STUDIO가 직접 운영",
    cta: "대행 문의",
  },
];

const FAQ = [
  { q: "상담은 무료인가요?", a: "네, 첫 상담은 완전 무료입니다. 채널 현황 진단 후 맞는 서비스를 안내해 드립니다." },
  { q: "채널 대행은 최소 계약 기간이 있나요?", a: "최소 3개월 계약을 권장합니다. 채널 성장 데이터가 축적되어야 실질적인 개선이 가능하기 때문입니다." },
  { q: "유튜브 초보도 괜찮나요?", a: "네, 구독자 0명부터 시작해도 됩니다. 채널이 없다면 처음부터 함께 설계합니다." },
  { q: "결제는 어떻게 하나요?", a: "카카오톡 상담 후 안내드립니다. 카드/계좌이체 모두 가능합니다." },
];

export default function ConsultingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-screen-xl mx-auto px-4 py-10">
          <Link href="/studio" className="text-xs text-gray-500 hover:text-gray-300 transition mb-4 inline-flex items-center gap-1">
            ← TMK STUDIO
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">무료 상담 신청</h1>
          <p className="text-gray-400 text-sm">채널 현황을 먼저 진단하고, 맞는 서비스를 안내해 드립니다.</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* 좌측: 상담 유형 + 연락처 */}
          <div className="space-y-8">
            {/* 상담 유형 */}
            <div>
              <h2 className="font-bold text-lg mb-5">어떤 도움이 필요하신가요?</h2>
              <div className="space-y-3">
                {CONSULTATION_TYPES.map((type) => (
                  <div key={type.title} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium mb-1 text-sm">{type.title}</div>
                        <p className="text-xs text-gray-400 mb-3">{type.desc}</p>
                        <a
                          href="http://pf.kakao.com/_xoGexgG/chat"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition font-medium"
                        >
                          {type.cta} →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 연락처 */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-3">
              <h3 className="font-semibold text-sm">연락처</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">전화</span>
                  <a href="tel:07080272532" className="text-white hover:text-teal-400 transition">070-8027-2532</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">이메일</span>
                  <a href="mailto:bibl.content.official@gmail.com" className="text-white hover:text-teal-400 transition">
                    bibl.content.official@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">운영시간</span>
                  <span>월~금 09:00 ~ 18:00 (주말·공휴일 휴무)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 카카오채널 CTA + FAQ */}
          <div className="space-y-8">
            {/* 카카오 CTA 카드 */}
            <div className="rounded-2xl bg-yellow-400/10 border border-yellow-400/30 p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="font-bold text-xl mb-2">카카오톡으로 바로 문의</h2>
              <p className="text-sm text-gray-400 mb-6">
                평일 9시~18시 내 응답 보장.<br />
                채널 URL만 보내주시면 무료 진단을 시작합니다.
              </p>
              <a
                href="http://pf.kakao.com/_xoGexgG/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-bold transition text-sm"
              >
                카카오톡 채널 채팅
              </a>
              <p className="text-xs text-gray-600 mt-4">
                비공개 채팅 · 스팸 없음 · 무료
              </p>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="font-bold text-lg mb-5">자주 묻는 질문</h2>
              <div className="space-y-3">
                {FAQ.map((item) => (
                  <details key={item.q} className="rounded-xl bg-gray-900 border border-gray-800 group">
                    <summary className="p-4 cursor-pointer list-none text-sm font-medium flex items-center justify-between">
                      {item.q}
                      <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
