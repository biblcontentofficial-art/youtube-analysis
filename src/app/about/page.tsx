import type { Metadata } from "next";
import { OG_DEFAULT } from "@/lib/seo";
import Link from "next/link";
import { buttonClass, cx } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { TABLE, TD_PREVIEW, TH_PREVIEW } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "비블랩 소개, 유튜브 키워드·채널 분석 도구",
  description:
    "비블랩(bibl lab)은 유튜버와 크리에이터를 위한 유튜브 키워드 검색·채널 찾기 도구입니다. YouTube API Services를 통해 공개된 영상 데이터를 한 곳에 정리해 보여드립니다.",
  keywords: [
    "비블랩 소개", "비블 소개", "bibl lab 소개", "유튜브 분석 도구 소개",
    "유튜브 키워드 분석 서비스", "크리에이터 데이터 도구",
  ],
  alternates: { canonical: "https://bibllab.com/about" },
  openGraph: {
    ...OG_DEFAULT,
    title: "비블랩 소개, 유튜브 키워드·채널 분석 도구",
    description: "비블랩은 유튜버와 크리에이터를 위한 유튜브 분석 SaaS입니다.",
    url: "https://bibllab.com/about",
  },
};

const faqData = [
  {
    q: "비블랩(bibl lab)이 무엇인가요?",
    a: "비블랩은 유튜버·크리에이터·마케터가 콘텐츠 전략을 데이터로 수립할 수 있도록 돕는 유튜브 키워드 검색·채널 찾기 도구입니다. YouTube API Services를 통해 공개된 영상 데이터(조회수, 구독자 수, 게시일 등)를 한 곳에 정리해 보여줍니다.",
  },
  {
    q: "어떤 데이터를 보여주나요?",
    a: "YouTube가 공식적으로 제공하는 데이터만 표시합니다. 영상 제목·설명, 조회수, 좋아요 수, 댓글 수, 채널명, 채널 구독자 수, 게시일 등이 포함됩니다. 비공식 메트릭은 제공하지 않습니다.",
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

/** 구역 제목 */
const H2 = "mb-6 text-title text-fg";
/** 헤어라인 목록(기능·FAQ) */
const LIST = "divide-y divide-line border-y border-line";
const ITEM = "py-5";
const ITEM_TITLE = "text-ui font-bold text-fg md:text-body";
const ITEM_DESC = "mt-1.5 text-body-sm text-fg-2 md:text-ui";

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
      <main className="min-h-screen bg-canvas text-fg">
        <Container size="reading" className="space-y-16 py-16 md:space-y-20 md:py-24">

          {/* 헤더 */}
          <section>
            <SectionHeader caption="bibl lab 소개" label="ABOUT" />
            <h1 className="text-h3 text-silver md:text-h1">
              <span className="block">유튜브 데이터로</span>
              <span className="block"><span className="text-accent">트렌드를 선점</span>하세요</span>
            </h1>
            <p className="mt-5 text-ui text-fg-2 md:text-lead">
              비블랩(bibl lab)은 유튜버와 크리에이터가 데이터 기반으로
              콘텐츠 전략을 수립할 수 있도록 돕는 유튜브 분석 도구입니다.
            </p>
          </section>

          {/* 핵심 개념 */}
          <section>
            <h2 className={H2}>비블랩이 제공하는 것들</h2>
            <ul className={LIST}>
              <li className={ITEM}>
                <h3 className={ITEM_TITLE}>키워드 검색</h3>
                <p className={ITEM_DESC}>
                  관심 키워드를 입력하면 YouTube Data API v3를 통해 최신 영상 목록을 가져옵니다.
                  검색 결과에는 YouTube가 제공하는 영상 제목, 설명, 채널명, 조회수, 좋아요 수,
                  게시일 등이 포함됩니다.
                </p>
              </li>
              <li className={ITEM}>
                <h3 className={ITEM_TITLE}>채널 찾기</h3>
                <p className={ITEM_DESC}>
                  특정 주제·분야에서 성장 중인 유튜브 채널을 발견합니다.
                  구독자 급상승 채널, 신생 채널 필터를 통해 아직 덜 알려진 잠재력 있는 채널을 찾을 수 있습니다.
                  협업 파트너를 찾거나 성장 공식을 벤치마킹할 때 활용됩니다.
                </p>
              </li>
              <li className={ITEM}>
                <h3 className={ITEM_TITLE}>영상 수집 · CSV 내보내기</h3>
                <p className={ITEM_DESC}>
                  마음에 드는 영상을 컬렉션에 저장하고, CSV 파일로 한 번에 내보낼 수 있습니다.
                  벤치마킹·레퍼런스 관리에 유용합니다.
                </p>
              </li>
            </ul>
          </section>

          {/* 주요 기능 안내 */}
          <section>
            <h2 className={H2}>주요 기능 안내</h2>
            <ul className={LIST}>
              {[
                { name: "영상 찾기", desc: "키워드 기반 유튜브 영상 검색 기능입니다. 조회수·좋아요·댓글 수 등 성과 데이터를 분석하고, 트렌드 키워드를 발굴하여 콘텐츠 기획을 지원합니다. 사용자가 자신의 콘텐츠 주제를 탐색하기 위한 리서치 도구입니다." },
                { name: "채널 찾기", desc: "유튜브 채널 검색 및 성장 데이터 분석 기능입니다. 구독자 수·업로드 빈도·평균 조회수 등 채널 지표를 비교하고, 벤치마킹을 위한 경쟁 채널 분석을 제공합니다." },
                { name: "수집한 영상", desc: "사용자가 관심 있는 영상을 저장·분류하여 콘텐츠 리서치에 체계적으로 활용할 수 있는 기능입니다." },
                { name: "내 채널 분석", desc: "자신의 유튜브 채널 성과를 대시보드로 확인하는 기능입니다. YouTube Analytics API 연동을 통해 영상별 성과 추이, 구독자 변화 등 자체 채널 운영 인사이트를 제공합니다." },
                { name: "스레드 검색", desc: "Meta Threads 플랫폼의 콘텐츠 트렌드를 검색하는 기능입니다. Threads API를 활용해 공개 게시물 데이터를 분석하고, 멀티플랫폼 콘텐츠 전략 수립을 지원합니다." },
              ].map((f) => (
                <li key={f.name} className={ITEM}>
                  <h3 className={ITEM_TITLE}>{f.name}</h3>
                  <p className={ITEM_DESC}>{f.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 서비스 성격 안내 */}
          <section className="rounded-panel border border-line bg-surface p-6 md:p-8">
            <h2 className={cx(H2, "mb-4")}>bibl lab은 데이터 분석 도구입니다</h2>
            <p className="mb-5 text-body-sm text-fg-2 md:text-ui">
              bibl lab은 바이럴 마케팅 대행 서비스가 <strong className="font-semibold text-fg">아닙니다</strong>.
              순수하게 공개된 유튜브/스레드 데이터를 분석하여, 콘텐츠 기획자가 자신의 콘텐츠를
              개선하는 데 활용하는 데이터 분석 SaaS입니다.
            </p>
            <ul className="space-y-2.5 text-body-sm text-fg-2 md:text-ui">
              <li className="flex items-start gap-2.5"><CloseIcon size={16} className="mt-1 text-fg-4" /> 타인의 SNS 계정을 이용한 광고·홍보 대행을 하지 않습니다</li>
              <li className="flex items-start gap-2.5"><CloseIcon size={16} className="mt-1 text-fg-4" /> 인플루언서 섭외·매칭 서비스를 제공하지 않습니다</li>
              <li className="flex items-start gap-2.5"><CloseIcon size={16} className="mt-1 text-fg-4" /> 자동 댓글·자동 팔로우 등 SNS 조작 기능이 없습니다</li>
              <li className="flex items-start gap-2.5"><CheckIcon size={16} className="mt-1 text-fg" /> YouTube Data API, Threads API 등 공개 API 데이터만 활용합니다</li>
              <li className="flex items-start gap-2.5"><CheckIcon size={16} className="mt-1 text-fg" /> 크리에이터가 자신의 콘텐츠 전략을 수립하는 데 사용합니다</li>
            </ul>
          </section>

          {/* 사용 대상 */}
          <section>
            <h2 className={H2}>이런 분들에게 맞습니다</h2>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {[
                { title: "개인 유튜버", desc: "새 채널을 시작하거나 정체된 채널의 돌파구를 찾는 크리에이터. 어떤 주제가 알고리즘 선택을 받는지 데이터로 파악합니다." },
                { title: "팀·스튜디오", desc: "여러 채널을 운영하는 팀. Pro 플랜으로 팀원 2명까지, Business 플랜으로 최대 5명이 함께 사용할 수 있습니다." },
                { title: "브랜드 마케터", desc: "유튜브를 마케팅 채널로 활용하는 브랜드. 어떤 키워드와 형식의 콘텐츠가 효과적인지 데이터로 검증합니다." },
                { title: "MCN·에이전시", desc: "성장 가능성 있는 채널에 협업을 제안하는 MCN. 채널 찾기 기능으로 유망 크리에이터를 발견합니다." },
              ].map((item) => (
                <div key={item.title} className="rounded-card border border-line bg-surface p-5">
                  <h3 className="text-ui font-bold text-fg">{item.title}</h3>
                  <p className="mt-2 text-body-sm text-fg-3">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 요금제 요약 */}
          <section>
            <h2 className={cx(H2, "mb-2")}>요금제</h2>
            <p className="mb-6 text-body-sm text-fg-3">무료로 시작하고 필요할 때 업그레이드하세요. 언제든지 취소 가능합니다.</p>
            <div className="overflow-x-auto">
              <table className={cx(TABLE, "min-w-[20rem]")}>
                <thead>
                  <tr>
                    <th scope="col" className={cx(TH_PREVIEW, "pr-4")}>플랜</th>
                    <th scope="col" className={cx(TH_PREVIEW, "pr-4 text-right")}>월 요금</th>
                    <th scope="col" className={cx(TH_PREVIEW, "pr-4 text-right")}>영상 검색</th>
                    <th scope="col" className={cx(TH_PREVIEW, "text-right")}>채널 검색</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { plan: "Free", price: "무료", search: "2회/일", channel: "1회/일" },
                    { plan: "Starter", price: "₩15,000", search: "50회/월", channel: "30회/월" },
                    { plan: "Pro", price: "₩39,000", search: "500회/월", channel: "500회/월" },
                    { plan: "TEAM BIBL", price: "₩490,000", search: "무제한", channel: "무제한" },
                  ].map((row) => (
                    <tr key={row.plan}>
                      <td className={cx(TD_PREVIEW, "whitespace-nowrap pr-4 text-body-sm font-semibold text-fg")}>{row.plan}</td>
                      <td className={cx(TD_PREVIEW, "tnum whitespace-nowrap pr-4 text-right text-body-sm text-fg-2")}>{row.price}</td>
                      <td className={cx(TD_PREVIEW, "tnum whitespace-nowrap pr-4 text-right text-body-sm text-fg-2")}>{row.search}</td>
                      <td className={cx(TD_PREVIEW, "tnum whitespace-nowrap text-right text-body-sm text-fg-2")}>{row.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <Link href="/pricing" className="group inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2">
                상세 요금제 보기 <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className={H2}>자주 묻는 질문</h2>
            <ul className={LIST}>
              {faqData.map((item) => (
                <li key={item.q} className={ITEM}>
                  <h3 className={ITEM_TITLE}>{item.q}</h3>
                  <p className={ITEM_DESC}>{item.a}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="border-t border-line pt-12 md:pt-16">
            <h2 className="text-h3 text-fg md:text-h2">지금 바로 시작해보세요</h2>
            <p className="mt-3 text-ui text-fg-2 md:text-body">회원가입 후 무료로 유튜브 키워드 분석을 경험해보세요.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search" className={buttonClass({ size: "lg" })}>
                무료로 분석 시작
              </Link>
              <Link href="/pricing" className={buttonClass({ variant: "secondary", size: "lg" })}>
                요금제 보기
              </Link>
            </div>
          </section>

          {/* 회사 정보 */}
          <section className="space-y-1 border-t border-line-soft pt-8 text-micro leading-[1.8] text-fg-3">
            <p className="font-semibold text-fg-2">운영사 정보</p>
            <p>상호: 세모골프 | 대표자: 김태민</p>
            <p>사업자등록번호: 315-47-01018 | 통신판매업신고번호: 2023-수원권선-1549</p>
            <p>주소: 경기도 수원시 권선구 세화로 151번길 29-2 1층</p>
            <p>이메일: bibl.content.official@gmail.com | 전화: 070-8027-2532</p>
          </section>

        </Container>
      </main>
    </>
  );
}
