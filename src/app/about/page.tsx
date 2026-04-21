import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "비블랩 소개 — 유튜브 키워드·채널 분석 도구",
  description:
    "비블랩(bibl lab)은 유튜버와 크리에이터가 유튜브 알고리즘을 이해하고 성공적인 콘텐츠 전략을 수립할 수 있도록 돕는 데이터 분석 SaaS입니다. 반응도 분석, 아웃라이어 탐지, 채널 찾기 기능을 제공합니다.",
  keywords: [
    "비블랩 소개", "비블 소개", "bibl lab 소개", "유튜브 분석 도구 소개",
    "유튜브 키워드 분석 서비스", "크리에이터 데이터 도구",
  ],
  alternates: { canonical: "https://bibllab.com/about" },
  openGraph: {
    title: "비블랩 소개 — 유튜브 키워드·채널 분석 도구",
    description: "비블랩은 유튜버와 크리에이터를 위한 유튜브 분석 SaaS입니다.",
    url: "https://bibllab.com/about",
  },
};

const faqData = [
  {
    q: "비블랩(bibl lab)이 무엇인가요?",
    a: "비블랩은 유튜버·크리에이터·마케터가 콘텐츠 전략을 데이터로 수립할 수 있도록 돕는 유튜브 분석 SaaS입니다. 키워드를 검색하면 최신 영상 데이터를 수집하고, 조회수·구독자 비율 기반의 반응도 분석, 아웃라이어 탐지, 알고리즘 상승 확률을 제공합니다.",
  },
  {
    q: "반응도(Good/Normal/Bad)는 어떻게 계산되나요?",
    a: "반응도는 채널 구독자 수 대비 영상 조회수 비율로 판단합니다. 같은 주제라도 구독자가 적은 채널에서 높은 조회수를 기록한 영상이 'Good' 등급을 받습니다. 이는 유튜브 알고리즘이 외부 시청자에게 적극 추천하고 있다는 신호입니다.",
  },
  {
    q: "아웃라이어(Outlier)란 무엇인가요?",
    a: "아웃라이어는 같은 채널의 다른 영상들과 비교해 이례적으로 높은 조회수를 기록한 영상입니다. 알고리즘 추천을 받고 있다는 강력한 신호이므로, 해당 영상의 주제·썸네일·제목 패턴을 벤치마킹하면 효과적인 콘텐츠 전략을 수립할 수 있습니다.",
  },
  {
    q: "무료로 사용할 수 있나요?",
    a: "네. Free 플랜으로 하루 2회 영상 검색, 1회 채널 검색을 무료로 이용할 수 있습니다. 회원가입 후 즉시 시작 가능하며, 신용카드 없이도 이용 가능합니다.",
  },
  {
    q: "어떤 크리에이터에게 도움이 되나요?",
    a: "비블랩은 다음 분들에게 특히 유용합니다: (1) 새로운 콘텐츠 주제를 찾고 있는 유튜버, (2) 경쟁 채널과 트렌드를 파악하려는 크리에이터, (3) 브랜드 마케터나 MCN, (4) 성장 가능성 있는 채널에 협업을 제안하려는 에이전시.",
  },
  {
    q: "데이터는 얼마나 정확하고 최신인가요?",
    a: "YouTube Data API v3를 통해 실시간으로 최신 영상 데이터를 수집합니다. 검색 시점의 최신 조회수·구독자 수 데이터가 반영됩니다.",
  },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "비블랩 소개",
    url: "https://bibllab.com/about",
    description: "비블랩(bibl lab)은 유튜버·크리에이터를 위한 유튜브 키워드 분석 SaaS 서비스입니다.",
    mainEntity: {
      "@type": "Organization",
      name: "세모골프",
      alternateName: ["비블랩", "bibl lab", "bibllab"],
      url: "https://bibllab.com",
      foundingDate: "2024",
      email: "bibl.content.official@gmail.com",
      description:
        "유튜브 크리에이터 교육·분석 전문 기업. bibl lab 서비스를 운영하며 유튜버들의 데이터 기반 성장을 지원합니다.",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gray-950 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-16">

          {/* 헤더 */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center rounded-full border border-teal-800 bg-teal-950/50 px-4 py-1.5 text-sm text-teal-400">
              bibl lab 소개
            </div>
            <h1 className="text-4xl font-extrabold">
              유튜브 데이터로<br />
              <span className="text-teal-400">트렌드를 선점</span>하세요
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              비블랩(bibl lab)은 유튜버와 크리에이터가 데이터 기반으로
              콘텐츠 전략을 수립할 수 있도록 돕는 유튜브 분석 도구입니다.
            </p>
          </section>

          {/* 핵심 개념 */}
          <section>
            <h2 className="text-2xl font-bold mb-6">비블랩이 분석하는 것들</h2>
            <div className="grid gap-5">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-teal-400 mb-2">반응도 분석 (Good / Normal / Bad)</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  채널 구독자 수 대비 영상 조회수 비율을 계산해 영상 성과를 3단계로 판단합니다.
                  구독자가 1만 명인 채널의 영상이 50만 조회수를 기록했다면, 유튜브 알고리즘이
                  외부 시청자에게 적극 추천하고 있다는 의미입니다. 이런 영상이 <strong className="text-white">'Good'</strong> 등급입니다.
                  같은 키워드에서 어떤 주제·형식의 영상이 알고리즘 선택을 받는지 파악할 수 있습니다.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-amber-400 mb-2">아웃라이어 탐지</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  같은 채널의 다른 영상들과 비교해 이례적으로 높은 조회수를 기록한 영상을 탐지합니다.
                  아웃라이어 영상은 유튜브 알고리즘 추천을 받고 있다는 강력한 신호입니다.
                  이 영상의 주제·썸네일·제목·길이를 분석하면 <strong className="text-white">성공 패턴</strong>을 발견할 수 있습니다.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-purple-400 mb-2">알고리즘 상승 확률</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  여러 지표를 종합해 해당 키워드에서 영상이 유튜브 알고리즘 추천을 받을 가능성을
                  수치로 제공합니다. 영상 기획 전 키워드별 잠재력을 미리 파악할 수 있습니다.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-2">채널 찾기</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  특정 주제·분야에서 성장 중인 유튜브 채널을 발견합니다.
                  구독자 급상승 채널, 신생 채널 필터를 통해 아직 덜 알려진 잠재력 있는 채널을 찾을 수 있습니다.
                  협업 파트너를 찾거나 성장 공식을 벤치마킹할 때 활용됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 주요 기능 안내 */}
          <section>
            <h2 className="text-2xl font-bold mb-6">주요 기능 안내</h2>
            <div className="grid gap-4">
              {[
                { name: "영상 찾기", desc: "키워드 기반 유튜브 영상 검색 기능입니다. 조회수·좋아요·댓글 수 등 성과 데이터를 분석하고, 트렌드 키워드를 발굴하여 콘텐츠 기획을 지원합니다. 사용자가 자신의 콘텐츠 주제를 탐색하기 위한 리서치 도구입니다." },
                { name: "채널 찾기", desc: "유튜브 채널 검색 및 성장 데이터 분석 기능입니다. 구독자 수·업로드 빈도·평균 조회수 등 채널 지표를 비교하고, 벤치마킹을 위한 경쟁 채널 분석을 제공합니다." },
                { name: "수집한 영상", desc: "사용자가 관심 있는 영상을 저장·분류하여 콘텐츠 리서치에 체계적으로 활용할 수 있는 기능입니다." },
                { name: "내 채널 분석", desc: "자신의 유튜브 채널 성과를 대시보드로 확인하는 기능입니다. YouTube Analytics API 연동을 통해 영상별 성과 추이, 구독자 변화 등 자체 채널 운영 인사이트를 제공합니다." },
                { name: "스레드 검색", desc: "Meta Threads 플랫폼의 콘텐츠 트렌드를 검색하는 기능입니다. Threads API를 활용해 공개 게시물 데이터를 분석하고, 멀티플랫폼 콘텐츠 전략 수립을 지원합니다." },
              ].map((f) => (
                <div key={f.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-1">{f.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 서비스 성격 안내 */}
          <section className="bg-gray-900 border border-teal-900/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">bibl lab은 데이터 분석 도구입니다</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              bibl lab은 바이럴 마케팅 대행 서비스가 <strong className="text-white">아닙니다</strong>.
              순수하게 공개된 유튜브/스레드 데이터를 분석하여, 콘텐츠 기획자가 자신의 콘텐츠를
              개선하는 데 활용하는 데이터 분석 SaaS입니다.
            </p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#10005;</span> 타인의 SNS 계정을 이용한 광고·홍보 대행을 하지 않습니다</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#10005;</span> 인플루언서 섭외·매칭 서비스를 제공하지 않습니다</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#10005;</span> 자동 댓글·자동 팔로우 등 SNS 조작 기능이 없습니다</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">&#10003;</span> YouTube Data API, Threads API 등 공개 API 데이터만 활용합니다</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">&#10003;</span> 크리에이터가 자신의 콘텐츠 전략을 수립하는 데 사용합니다</li>
            </ul>
          </section>

          {/* 사용 대상 */}
          <section>
            <h2 className="text-2xl font-bold mb-6">이런 분들에게 맞습니다</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "개인 유튜버", desc: "새 채널을 시작하거나 정체된 채널의 돌파구를 찾는 크리에이터. 어떤 주제가 알고리즘 선택을 받는지 데이터로 파악합니다." },
                { title: "팀·스튜디오", desc: "여러 채널을 운영하는 팀. Pro 플랜으로 팀원 2명까지, Business 플랜으로 최대 5명이 함께 사용할 수 있습니다." },
                { title: "브랜드 마케터", desc: "유튜브를 마케팅 채널로 활용하는 브랜드. 어떤 키워드와 형식의 콘텐츠가 효과적인지 데이터로 검증합니다." },
                { title: "MCN·에이전시", desc: "성장 가능성 있는 채널에 협업을 제안하는 MCN. 채널 찾기 기능으로 유망 크리에이터를 발견합니다." },
              ].map((item) => (
                <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 요금제 요약 */}
          <section>
            <h2 className="text-2xl font-bold mb-2">요금제</h2>
            <p className="text-gray-500 text-sm mb-6">무료로 시작하고 필요할 때 업그레이드하세요. 언제든지 취소 가능합니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 pr-6 text-gray-400 font-medium">플랜</th>
                    <th className="text-left py-3 pr-6 text-gray-400 font-medium">월 요금</th>
                    <th className="text-left py-3 pr-6 text-gray-400 font-medium">영상 검색</th>
                    <th className="text-left py-3 text-gray-400 font-medium">채널 검색</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {[
                    { plan: "Free", price: "무료", search: "2회/일", channel: "1회/일" },
                    { plan: "Starter", price: "₩15,000", search: "50회/월", channel: "30회/월" },
                    { plan: "Pro", price: "₩39,000", search: "500회/월", channel: "500회/월" },
                    { plan: "Team bibl", price: "₩310,000", search: "무제한", channel: "무제한" },
                  ].map((row) => (
                    <tr key={row.plan}>
                      <td className="py-3 pr-6 font-medium text-white">{row.plan}</td>
                      <td className="py-3 pr-6 text-gray-300">{row.price}</td>
                      <td className="py-3 pr-6 text-gray-300">{row.search}</td>
                      <td className="py-3 text-gray-300">{row.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Link href="/pricing" className="text-teal-400 text-sm hover:underline">
                상세 요금제 보기 →
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold mb-6">자주 묻는 질문</h2>
            <div className="space-y-4">
              {faqData.map((item) => (
                <div key={item.q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2 text-sm">{item.q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gray-900 border border-gray-800 rounded-2xl p-10 space-y-4">
            <h2 className="text-2xl font-bold">지금 바로 시작해보세요</h2>
            <p className="text-gray-400">회원가입 후 무료로 유튜브 키워드 분석을 경험해보세요.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/search"
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
              >
                무료로 분석 시작
              </Link>
              <Link
                href="/pricing"
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
              >
                요금제 보기
              </Link>
            </div>
          </section>

          {/* 회사 정보 */}
          <section className="border-t border-gray-800 pt-8 text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-500">운영사 정보</p>
            <p>상호: 세모골프 | 대표자: 김태민</p>
            <p>사업자등록번호: 315-47-01018 | 통신판매업신고번호: 2023-수원권선-1549</p>
            <p>주소: 경기도 수원시 권선구 세화로 151번길 29-2 1층</p>
            <p>이메일: bibl.content.official@gmail.com | 전화: 070-8027-2532</p>
          </section>

        </div>
      </main>
    </>
  );
}
