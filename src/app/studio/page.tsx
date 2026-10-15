/**
 * /studio 채널 대행(정적 페이지, force-static). DESIGN 7.3 대행 규칙:
 * 첫 화면 실버 플레이 버튼(무채색 보정판) + 두 톤 제목 → 문제 → 영상 → 홈 채널 실적 부품 → 90일 성과 → 마퀴
 * → 7단계('01' 글자 숫자, 2단 sticky) → 차별점 → 비교표 → 후기 → 소개 → 가격 카드 → FAQ(2단, 6.21 아코디언) → 마지막 CTA(홈 #contact 원문).
 * 흰 '채널 대행 문의하기'는 챕터 끝(문제·비교표·후기·가격 카드·마지막)에 하나씩, 768 미만은 하단 바가 대신한다.
 * 빨간 강조(옛 리터럴 색)는 소유자 예외라 owner-red 토큰으로 이름만 옮겼다(DESIGN 3.4, 결정 7·6 기본 B).
 * StudioGuard 는 결정 1 전까지 그대로 둔다. 서버 인증을 붙이지 않는다.
 */
import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import Image from "next/image";
import TrackVisit from "@/app/_components/TrackVisit";
import AnimationObserver from "@/app/_components/AnimationObserver";
import HomeChannels from "@/app/_components/home/HomeChannels";
import { buttonClass, cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { BottomCTABar } from "@/components/ui/bottom-cta-bar";
import { CARD, CARD_LINK } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { TABLE, TD_PREVIEW, TH_PREVIEW } from "@/components/ui/table";
import StudioGuard from "./_components/StudioGuard";
import StatsCounter from "./_components/StatsCounter";
import VideoMarquee from "./_components/VideoMarquee";
import StudioFaq from "./_components/StudioFaq";
import ChannelAvatar from "@/app/_components/home/ChannelAvatar";
import rawContent from "./studio-content.json";

export const dynamic = "force-static";
// 포트폴리오 채널 실적(구독자·조회수)을 한 달에 한 번 새로 그린다
export const revalidate = 2592000;

// dev 환경에서만 DevEditor 로드
let DevEditor: React.ComponentType | null = null;
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DevEditor = require("./_components/DevEditor").default;
}

const C = rawContent;

export const metadata: Metadata = {
  title: "유튜브 채널 대행 | 70만 구독자 비블의 TMK STUDIO",
  description:
    "구독자 0명에서 24만까지. 총 70만+ 구독자 채널을 운영한 유튜브 전문가 비블이 기획·촬영·편집·업로드·분석까지 전 과정을 책임집니다. 지금 채널 대행 문의를 남겨보세요.",
  keywords: [
    "유튜브 채널 대행",
    "유튜브 대행",
    "유튜브 운영 대행",
    "유튜브 컨설팅",
    "유튜브 마케팅 대행사",
    "유튜브 채널 운영",
    "유튜브 기획 대행",
    "유튜브 편집 대행",
    "유튜브 채널 키우기",
    "유튜브 성장 대행",
    "MCN",
    "TMK STUDIO",
    "비블",
    "bibl lab",
    "유튜브 마케팅",
    "브랜디드 콘텐츠",
    "유튜브 SEO",
  ],
  alternates: {
    canonical: "https://bibllab.com/studio",
  },
  openGraph: {
    title: "유튜브 채널 대행 | 70만 구독자 비블의 TMK STUDIO",
    description:
      "구독자 0명에서 24만까지. 총 70만+ 구독자 채널을 운영한 유튜브 전문가 비블이 기획·촬영·편집·업로드·분석까지 전 과정을 책임집니다.",
    url: "https://bibllab.com/studio",
    siteName: "비블랩 (bibl lab)",
    images: [
      {
        url: "https://bibllab.com/studio/silver-play-button.jpg",
        width: 1200,
        height: 630,
        alt: "비블 TMK STUDIO · 유튜브 채널 대행 전문",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "유튜브 채널 대행 | 비블 TMK STUDIO",
    description: "구독자 0명에서 24만까지. 70만+ 구독자 채널 운영 비블이 직접 운영합니다.",
    images: ["https://bibllab.com/studio/silver-play-button.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD: Service 스키마 (구글이 "유튜브 채널 대행" 검색 시 노출)
const studioJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "비블 TMK STUDIO · 유튜브 채널 대행",
  serviceType: "유튜브 채널 운영 대행",
  description:
    "총 70만+ 구독자 채널을 운영한 비블이 직접 기획·촬영·편집·업로드·분석까지 전 과정을 대행합니다. " +
    "구독자 0명부터 24만까지 성장시킨 검증된 노하우로 여러분의 유튜브 채널을 키웁니다.",
  provider: {
    "@type": "Organization",
    name: "비블랩 (bibl lab)",
    url: "https://bibllab.com",
    logo: "https://bibllab.com/og-image.png",
    sameAs: ["https://www.youtube.com/@biblcontent"],
  },
  areaServed: { "@type": "Country", name: "South Korea" },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "유튜브 채널 대행 서비스",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "올인원 유튜브 채널 대행",
          description: "기획·촬영·편집·업로드·분석 전 과정 대행",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "1:1 유튜브 컨설팅",
          description: "70만+ 구독자 비블이 직접 진행하는 1:1 유튜브 브랜딩·비즈니스 컨설팅",
        },
      },
    ],
  },
  // NOTE: Service 타입은 구글 리뷰 스니펫 비대상이라 aggregateRating을 넣으면
  // 서치콘솔 "리뷰 스니펫 - 일부 항목이 잘못됨" 경고가 발생 → 제거
  url: "https://bibllab.com/studio",
};

// 비블 채널(소개 섹션 카드). 포트폴리오 채널 목록은 홈과 같은 채널 실적 부품(HomeChannels)이 그린다
const BIBL_CHANNEL = {
  name: "비블 bibl",
  handle: "@bibl_youtube",
  subsNum: "4.2만",
  avatar: "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
  banner: "https://yt3.googleusercontent.com/XDssFLodQnpmebO2quHSdHYPUroghTjlqATrtTahvyMNfVWUxTP4lr55XEKqLiUh-z2y2wJFaRQ=w1280-fcrop64=1,00000000ffffffff",
  url: "https://www.youtube.com/@bibl_youtube",
};

/** 실버 플레이 버튼 원본은 청색기가 있어 무채색 보정판으로 보인다(DESIGN 6.8). JSON 에서 다른 사진으로 바꾸면 그 사진을 쓴다 */
const HERO_IMAGE =
  C.hero.heroImage === "/studio/silver-play-button.jpg" ? "/home/silver-play-button-neutral.jpg" : C.hero.heroImage;

const CONTACT_HREF = "/studio/consulting";
/** 홈 HomeContact 와 같은 비블 채널 아이콘 */
const BIBL_AVATAR =
  "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj";
const CAPTION = "비블의 유튜브 채널 대행";
const WRAP = "mx-auto max-w-wide px-6 lg:px-8";
const SECTION = "border-b border-line";
const PAD = "py-16 md:py-24";

/** 흰 '채널 대행 문의하기'. data-studio-cta 가 화면에 보이는 동안 모바일 하단 바가 숨는다(흰 면 한 폴드에 하나) */
function ContactButton({ className, size = "lg" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <Link data-studio-cta href={CONTACT_HREF} className={cx(buttonClass({ size }), className)}>
      채널 대행 문의하기
    </Link>
  );
}

/** 카드·CTA 아래 보조 행동 글자 링크(DESIGN 6.5) */
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2"
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

const PROBLEMS = [
  {
    badge: "문제 01",
    title: "기획이 막막하다",
    desc: "무슨 주제로 찍어야 할지, 어떤 소재로 영상을 만들어야 할지 전혀 감이 안 옵니다. 경쟁자는 많은데 아무도 내 영상을 시청하지 않습니다.",
  },
  {
    badge: "문제 02",
    title: "시간이 없다",
    desc: "기획, 촬영, 편집까지 영상 하나 제작하는데 20시간 가까이 걸립니다. 본업까지 병행하면 결국 유튜브 업로드를 미루게 되죠. 업로드 주기가 늦어지는 채널은 점점 조회수가 줄어들 수 밖에 없습니다.",
  },
  {
    badge: "문제 03",
    title: "뭐가 문제인지 모른다",
    desc: "업로드 하더라도 조회수가 안나옵니다. 썸네일, 제목, 내용, 구매전환, 브랜딩 어떤것이 원인인지 알기 어렵기에 개선이 불가능합니다. 결국 포기하게 되죠.",
  },
];

const RESULTS_90D = [
  { value: "485.2만", label: "총 조회수 (90일)" },
  { value: "3,189만", label: "총 노출수" },
  { value: "8.01%", label: "평균 클릭률 (업계 평균 4~6%)" },
  { value: "35만 시간", label: "누적 시청 시간" },
  { value: "+5,100명", label: "구독자 순증 (90일)" },
  { value: "25.8만", label: "현재 구독자" },
];

const STEPS = [
  {
    title: "채널 대행 문의 + 기획 미팅",
    desc: "어떤 주제로 시작할지, 채널 방향성·브랜딩·비즈니스 모델까지 함께 잡습니다.",
  },
  {
    title: "채널 성장 기획서 (비블 직접 작성)",
    desc: "시장 분석, 포지셔닝, 수익화 설계를 담은 기획서를 받아보실 수 있습니다.",
  },
  {
    title: "데이터 기반 주제 선별 + 질문지 전달",
    desc: "비블랩 자체 유튜브 분석 SaaS로 트렌드와 효과가 검증된 주제를 선별하고, 시청자가 궁금해할 내용을 질문지로 전달드립니다.",
  },
  {
    title: "답변 → 유튜브 대본으로 디벨롭",
    desc: "질문지에 답변만 대략 채워주시면, 유튜브에서 통하는 구조의 대본 초안으로 디벨롭해 드립니다.",
  },
  {
    title: "촬영 (비블 현장 직접 디렉팅)",
    desc: "월 1회 촬영으로 한 번에 4건을 제작합니다. 비블과 유튜브 채널을 직접 운영 중인 PD가 현장에서 실시간 디렉팅합니다.",
  },
  {
    title: "편집 + 썸네일 + SEO 업로드",
    desc: "편집·자막·효과음은 물론, 클릭을 만드는 썸네일과 제목을 비블이 직접 제작해 업로드까지 완료합니다.",
  },
  {
    title: "데이터 분석 + 월간 리포트",
    desc: "클릭률·시청 지속시간·유입 경로를 분석해 월간 리포트를 드리고, 다음 달 전략을 조정합니다.",
  },
];

const DIFFERENCES = [
  {
    title: "직접 운영해 본 적이 없다",
    desc: "방송국·제작사 출신, 고가 장비, 수준급 편집. 겉보기엔 전문적이지만 결과는 좋지 않습니다. 유튜브의 본질은 고퀄리티 영상이 아니라 클릭하게 만들고, 끝까지 보게 만들고, 비즈니스로 연결되게 만드는 것이기 때문입니다.",
  },
  {
    title: "\"성과 보장\"은 위험 신호다",
    desc: "\"조회수 안 나오면 환불\", \"3개월에 구독자 1만 보장\", 이런 보장형 계약 뒤에는 트래픽을 돈으로 사서 주입하는 관행이 존재합니다. 보장 수치를 채우기 위한 어뷰징은 채널 자체를 망가뜨립니다.",
  },
  {
    title: "유튜브는 알아도 비즈니스를 모른다",
    desc: "채널을 빠르게 키우는 업체도 있습니다. 하지만 직접 사업을 해본 경험이 없다면, 채널이 커져도 매출로 이어지지 않습니다. 트래픽을 매출로 전환하는 것은 완전히 별개의 역량입니다.",
  },
];

const COMPARE = [
  { k: "직접 운영 채널", a: "없음", b: "총 70만 구독자, 7개 채널" },
  { k: "사업 경험", a: "영상 제작자 출신 다수", b: "유튜브 분석 SaaS 운영 · 매출 7억+ 쇼핑몰 · 유튜버 교육 컨설팅 · 오프라인 매장 3곳" },
  { k: "주제 선정", a: "감 · 회의", b: "자체 SaaS 데이터 + 운영 인사이트" },
  { k: "촬영 디렉팅", a: "PD 외주", b: "비블 직접 현장 디렉팅" },
  { k: "썸네일 · 제목", a: "디자이너 외주", b: "비블 직접 제작" },
  { k: "비즈니스 연결", a: "채널 성장에서 끝", b: "트래픽 → 매출 퍼널 + 브랜딩 설계" },
];

const ABOUT_GROUPS = [
  {
    title: "온라인",
    items: [
      "유튜브 총 70만+ 채널 운영 및 공동기획",
      "세계유명골프정보, 영어키위새, 스윔클래스, 비블bibl 등",
      "인스타그램 3.0만 @seyugolf",
      "스레드 2.2만 @bibl_youtube",
      "SEMOGOLF 대표 (골프 영상 제작, 쇼핑몰)",
      "TMK STUDIO 대표 (유튜브 제작 프로덕션)",
    ],
  },
  {
    title: "교육",
    items: ["사범대학 체육교육과 학사 (차석 졸업)", "2급 정교사", "팀 내부 교사 출신들의 유튜브 교육 커리큘럼"],
  },
  {
    title: "사업 운영",
    items: ["프랜차이즈 B사 3곳", "프랜차이즈 M사 1곳"],
  },
];

/** 가격 카드 포함 항목(옛 카드 한 줄 '기획 · 촬영 · 편집 · 업로드 · 채널관리 · 비블 디렉팅') */
const PRICE_INCLUDES = ["기획", "촬영", "편집", "업로드", "채널관리", "비블 디렉팅"];
/** 가격 조건(FAQ '계약 기간'·'촬영도 대행해주나요?' 답에 있는 사실만) */
const PRICE_TERMS = ["계약 단위 6개월", "월 1회 촬영으로 한 번에 4건 제작", "서울·경기 지역 출장비 없음"];

/** 섹션 안 두 톤 제목: 앞줄 fg-3 + 뒷줄 fg (DESIGN 4.4). 강조 색 글자는 소유자 예외(owner-red, 3.4) */
const H2 = "text-h3 text-fg md:text-h1";
const LEAD = "block text-fg-3";

export default function StudioPage() {
  return (
    <main id="main">
      {/* JSON-LD: 구글이 "유튜브 채널 대행" 검색 시 풍부한 결과(Service) 노출 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(studioJsonLd) }}
      />
      <StudioGuard />
      {/* 방문 기록은 페이지당 한 번 (섹션 라벨마다 두면 첫 방문에 11건이 쌓인다) */}
      <TrackVisit page="studio" />
      <AnimationObserver />
      {DevEditor && <DevEditor />}

      {/* ══ HERO: 실버 플레이 버튼 + 두 톤 제목. 첫 화면은 HTML 그대로 보인다(data-animate 없음) ══ */}
      <section aria-labelledby="studio-title" className={SECTION}>
        <div className={cx(WRAP, "pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-14")}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-6">
            <div className="min-w-0 lg:col-span-7 lg:pr-6">
              <p className="text-body-sm font-medium text-fg-3 md:text-body">
                {C.hero.badge.split("70만+").map((part, idx, arr) => (
                  <span key={idx}>
                    {part}
                    {idx < arr.length - 1 && <span className="font-bold text-owner-red">70만+</span>}
                  </span>
                ))}
              </p>

              <h1 id="studio-title" className="mt-4 text-h2 text-silver sm:text-[44px] lg:text-h1 xl:text-display">
                <span className="block">{C.hero.subtitle}</span>{" "}
                <span className="block">
                  {C.hero.titleLine1 && <>{C.hero.titleLine1} </>}
                  <span className="text-accent">{C.hero.titleHighlight}</span>
                </span>
              </h1>

              <p className="mt-4 max-w-[36em] whitespace-pre-line text-body text-fg-2 lg:mt-5 lg:text-lead">
                {C.hero.desc}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link data-studio-cta href={CONTACT_HREF} className={cx(buttonClass({ size: "lg" }), "w-full sm:w-auto")}>
                  {C.hero.ctaPrimary}
                </Link>
                <a href="#process" className={cx(buttonClass({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}>
                  {C.hero.ctaSecondary}
                </a>
              </div>

              <p className="mt-4 text-caption text-fg-3">채널 URL만 보내주시면 됩니다</p>
            </div>

            <figure className="lg:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-panel border border-line bg-surface-2">
                <Image
                  src={HERO_IMAGE}
                  alt="세계유명 골프정보가 받은 유튜브 실버 플레이 버튼"
                  fill
                  priority
                  sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 whitespace-pre-line text-caption text-fg-3">{C.hero.heroImageCaption}</figcaption>
            </figure>
          </div>

          {/* 숫자 통계(서버 HTML 부터 최종값) */}
          <StatsCounter />
        </div>
      </section>

      {/* ══ PROBLEM: 혼자 하면 왜 실패하는가 ══ */}
      <section aria-labelledby="problem-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="PROBLEM" />
          <h2 id="problem-title" data-animate="up" className={H2}>
            <span className={LEAD}>유튜브를 혼자 운영하면서</span>{" "}
            <span className="block">답답하지 않으셨나요?</span>
          </h2>

          <ul className="mt-10 grid gap-4 md:grid-cols-3 lg:mt-12 lg:gap-6">
            {PROBLEMS.map((item) => (
              <li key={item.title} data-animate="up" className={cx(CARD, "p-5 sm:p-6 lg:p-8")}>
                <span className={badgeClass()}>{item.badge}</span>
                <h3 className="mt-4 text-title">{item.title}</h3>
                <p className="mt-3 text-ui text-fg-2">{item.desc}</p>
              </li>
            ))}
          </ul>

          <div data-animate="up" className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-body text-fg-2">이 3가지 문제, 비블이 전부 해결합니다.</p>
            <ContactButton size="md" />
          </div>
        </div>
      </section>

      {/* ══ INTERVIEW: 소개 영상(화면 가까이 와야 불러온다) ══ */}
      <section aria-labelledby="interview-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="INTERVIEW" />
          <h2 id="interview-title" data-animate="up" className={H2}>
            영상으로 만나보세요
          </h2>
          <div className="mt-10 max-w-4xl lg:mt-12">
            <div className="relative aspect-video w-full overflow-hidden rounded-panel border border-line bg-surface-2">
              <iframe
                className="absolute inset-0 size-full"
                src="https://www.youtube.com/embed/ojLicBvcS4o?autoplay=1&mute=1&playsinline=1&rel=0&loop=1&playlist=ojLicBvcS4o"
                title="비블 소개 영상"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ PORTFOLIO: 홈과 같은 채널 실적 부품(DESIGN 6.28) ══ */}
      <HomeChannels id="portfolio" caption={CAPTION} label="PORTFOLIO" showRevenue={false} />

      {/* ══ 90일 실측 성과(세계유명 골프정보) + 보조 CTA ══ */}
      <section aria-labelledby="results-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <p className="text-body text-fg-2 md:text-lead">
            총 <span className="font-bold text-owner-red">70만+</span> 채널을 실제로 운영하고 있는 스튜디오입니다.
          </p>
          <div data-animate="up" className={cx(CARD, "mt-8 p-5 sm:p-6 lg:p-10")}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-caption text-fg-3">직접 운영 채널 실측 데이터</p>
                <h2 id="results-title" className="mt-2 text-title">
                  「세계유명 골프정보」 최근 90일 성과
                </h2>
              </div>
              <span className="text-caption text-fg-3">YouTube 스튜디오 기준</span>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
              {RESULTS_90D.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1.5 border-t border-line pt-4">
                  <dt className="text-caption text-fg-3">{s.label}</dt>
                  <dd className="tnum text-[26px] font-extrabold leading-none tracking-[-0.03em] md:text-[32px]">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 border-t border-line pt-6 text-body-sm text-fg-2 md:text-ui">
              채널 성과에서 끝나지 않습니다. 이 트래픽은 골프 쇼핑몰{" "}
              <span className="font-semibold text-owner-red">연 매출 7억+</span>으로 직접 연결됩니다. 트래픽을 매출로
              전환하는 비즈니스 설계, 일반 대행사와 가장 다른 지점입니다.
            </p>
          </div>
          <div className="mt-4">
            <TextLink href={CONTACT_HREF}>채널 대행 문의하기</TextLink>
          </div>
        </div>
      </section>

      {/* ══ CONTENTS: 영상 썸네일 마퀴 ══ */}
      <section aria-labelledby="contents-title" className={cx(SECTION, PAD, "overflow-hidden")}>
        <div className={cx(WRAP, "mb-10")}>
          <SectionHeader caption={CAPTION} label="CONTENTS" />
          <h2 id="contents-title" data-animate="up" className={H2}>
            <span className={LEAD}>{C.marquee.titleLine1}</span>{" "}
            <span className="block">
              <span className="text-owner-red">{C.marquee.titleHighlight}</span>
              {C.marquee.titleLine2}
            </span>
          </h2>
          <div className="mt-5 max-w-2xl space-y-3 text-body text-fg-2">
            <p>{C.marquee.desc1}</p>
            <p>{C.marquee.desc2}</p>
          </div>
        </div>
        <VideoMarquee />
      </section>

      {/* ══ PROCESS: 2단(왼쪽 제목 sticky), 단계는 '01' 글자 숫자 ══ */}
      <section id="process" aria-labelledby="process-title" className={cx(SECTION, "scroll-mt-[var(--nav-h,56px)]")}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="PROCESS" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5 lg:pr-8">
              <div className="lg:sticky lg:top-[calc(var(--nav-h,56px)+2rem)]">
                <h2 id="process-title" data-animate="up" className={H2}>
                  <span className={LEAD}>문의부터 운영까지,</span>{" "}
                  <span className="block">
                    <span className="text-owner-red">7단계</span>로 진행됩니다
                  </span>
                </h2>
                <p className="mt-5 text-body text-fg-2">
                  여러분이 쓰는 시간은 월 촬영 하루 3~4시간, 질문지 답변 2~3시간이 전부입니다
                </p>
              </div>
            </div>
            <ol className="lg:col-span-7">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.75rem_1fr] border-t border-line py-5 last:border-b md:py-6">
                  <span aria-hidden="true" className="tnum pt-1 text-body-sm font-bold text-silver">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lead font-bold leading-[1.4]">{s.title}</h3>
                    <p className="mt-1.5 text-ui text-fg-3">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ══ STRENGTH: 4가지 차별점 ══ */}
      <section id="features" aria-labelledby="features-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="STRENGTH" />
          <h2 id="features-title" className="sr-only">
            4가지 차별점
          </h2>
          <div className="space-y-12 md:space-y-16">
            {C.features.map((feat, i) => (
              <article key={feat.num} className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-10 lg:gap-16">
                <div data-animate="up" className={cx("border-t border-line pt-5", i % 2 === 1 && "md:order-2")}>
                  <span aria-hidden="true" className="tnum text-body-sm font-bold text-silver">
                    {feat.num}
                  </span>
                  <h3 className="mt-2 text-title md:text-[28px] md:leading-[1.3]">{feat.title}</h3>
                  <p className="mt-4 whitespace-pre-line text-body text-fg-2">{feat.desc}</p>
                </div>
                <div className={cx("relative aspect-[3/2] overflow-hidden rounded-panel border border-line bg-surface-2", i % 2 === 1 && "md:order-1")}>
                  <Image src={feat.img} alt={feat.imgAlt} fill sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DIFFERENCE: 기존 대행사의 구조적 문제 + 비교표 ══ */}
      <section aria-labelledby="difference-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="DIFFERENCE" />
          <h2 id="difference-title" data-animate="up" className={H2}>
            <span className={LEAD}>기존 유튜브 대행사의</span>{" "}
            <span className="block">
              <span className="text-owner-red">3가지</span> 구조적 문제
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-body text-fg-2">
            직접 이 사업에 뛰어들어 경쟁사를 깊이 분석한 결과, 업계에는 명확한 구조적 문제가 있었습니다.
          </p>

          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6 lg:mt-12">
            {DIFFERENCES.map((item, i) => (
              <li key={item.title} data-animate="up" className="border-t border-line pt-5">
                <span aria-hidden="true" className="tnum text-body-sm font-bold text-silver">
                  {`0${i + 1}`}
                </span>
                <h3 className="mt-2 text-lead font-bold leading-[1.4]">{item.title}</h3>
                <p className="mt-2 text-ui text-fg-2">{item.desc}</p>
              </li>
            ))}
          </ol>

          {/* 비교표: 768 이상 표 */}
          <div className="mt-14 hidden md:block lg:mt-16">
            <table className={TABLE}>
              <caption className="sr-only">일반 대행사와 TMK STUDIO 비교</caption>
              <colgroup>
                <col className="w-44" />
                <col className="w-[34%]" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={cx(TH_PREVIEW, "pr-4")}>항목</th>
                  <th scope="col" className={cx(TH_PREVIEW, "pr-4")}>일반 대행사</th>
                  <th scope="col" className={cx(TH_PREVIEW, "font-semibold text-accent")}>TMK STUDIO</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.k}>
                    <th scope="row" className={cx(TD_PREVIEW, "py-4 pr-4 text-left text-body-sm font-medium text-fg-3")}>{row.k}</th>
                    <td className={cx(TD_PREVIEW, "py-4 pr-4 align-top text-body-sm text-fg-3")}>{row.a}</td>
                    <td className={cx(TD_PREVIEW, "py-4 align-top text-ui font-semibold text-fg")}>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 비교표: 768 미만 항목별 스택(값이 잘리지 않는다) */}
          <dl className="mt-12 divide-y divide-line-soft border-y border-line md:hidden">
            {COMPARE.map((row) => (
              <div key={row.k} className="py-4">
                <dt className="text-caption font-medium text-fg-3">{row.k}</dt>
                <dd className="mt-2 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-body-sm">
                  <span className="text-fg-3">일반 대행사</span>
                  <span className="text-fg-3">{row.a}</span>
                  <span className="font-semibold text-fg">TMK STUDIO</span>
                  <span className="font-semibold text-fg">{row.b}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <ContactButton />
          </div>
        </div>
      </section>

      {/* ══ REVIEW: 고객 후기(lg 6칸 그리드: 3 + 2) ══ */}
      <section aria-labelledby="review-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="REVIEW" />
          <h2 id="review-title" data-animate="up" className={H2}>
            숫자가 거짓말하지 않습니다
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-12 lg:grid-cols-6 lg:gap-6">
            {C.reviews.map((r, i) => (
              <li
                key={r.name}
                data-animate="up"
                className={cx(CARD, "flex flex-col p-5 sm:p-6", i < 3 ? "lg:col-span-2" : "lg:col-span-3")}
              >
                <p className="text-body-sm font-bold text-owner-red">{r.result}</p>
                <p className="mt-3 flex-1 text-ui text-fg-1">&ldquo;{r.text}&rdquo;</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-caption font-medium text-fg-3">{r.name}</span>
                  <span className="text-caption text-fg-2">
                    <span aria-hidden="true">★★★★★</span>
                    <span className="sr-only">별점 5점</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <ContactButton />
          </div>
        </div>
      </section>

      {/* ══ ABOUT: 운영자 소개 ══ */}
      <section aria-labelledby="about-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="ABOUT" />
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-6 lg:pr-8">
              <h2 id="about-title" className={H2}>
                비블 (김태민)
              </h2>
              <p className="mt-2 text-lead font-bold text-owner-red">TMK STUDIO 대표</p>

              <div className="mt-8 space-y-6">
                {ABOUT_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-caption font-semibold text-fg-3">{group.title}</h3>
                    <ul className="mt-2.5 space-y-2">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-body text-fg-2">
                          <CheckIcon size={16} className="mt-1.5 text-fg-3" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <a
                href={BIBL_CHANNEL.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cx(buttonClass({ variant: "secondary" }), "mt-8")}
              >
                <svg className="size-4 text-youtube" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                비블 채널 바로가기
                <span className="sr-only"> (새 창)</span>
              </a>
            </div>

            {/* 비블 채널 카드(hover 는 선 색만) */}
            <a
              href={BIBL_CHANNEL.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(CARD, CARD_LINK, "overflow-hidden lg:col-span-6")}
            >
              <div className="relative aspect-[16/6] bg-surface-2">
                <Image src={BIBL_CHANNEL.banner} alt="비블 bibl 채널 배너" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
              </div>
              <div className="relative px-5 pb-5 pt-10">
                <div className="absolute -top-7 left-5 size-14 overflow-hidden rounded-full border-[3px] border-surface bg-surface-2">
                  <Image src={BIBL_CHANNEL.avatar} alt="" width={56} height={56} className="size-full object-cover" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-ui font-bold text-fg">{BIBL_CHANNEL.name}</p>
                    <p className="text-caption text-fg-3">{BIBL_CHANNEL.handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="tnum text-h4 font-extrabold">{BIBL_CHANNEL.subsNum}</p>
                    <p className="text-caption text-fg-3">구독자</p>
                  </div>
                </div>
                <p className="mt-3 text-caption text-fg-3">사업하는 사람들의 이야기를 전합니다 · 동영상 248개</p>
              </div>
              <span className="sr-only"> (새 창)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══ PRICE: 컨테이너 폭 가격 카드 하나 ══ */}
      <section aria-labelledby="price-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="PRICE" />
          <h2 id="price-title" data-animate="up" className={H2}>
            명확한 가격으로 안내합니다
          </h2>
          <p className="mt-5 text-lead font-bold text-fg md:text-h4">
            기본 구성 · 월 콘텐츠 발행량{" "}
            <span className="text-owner-red">롱폼 4개 + 쇼츠(롱폼 리프레이밍) 4개</span>
          </p>

          <div className={cx(CARD, "mt-10 grid grid-cols-1 gap-8 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:gap-12 lg:mt-12 lg:p-10")}>
            <div className="min-w-0">
              <h3 className="text-title">비블 유튜브 대행 패키지</h3>
              <p className="mt-2 text-ui text-fg-2">월 롱폼 4개 + 쇼츠(롱폼 리프레이밍) 4개</p>
              <ul aria-label="포함 항목" className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                {PRICE_INCLUDES.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-ui text-fg-1">
                    <CheckIcon size={16} className="text-fg-3" />
                    {item}
                  </li>
                ))}
              </ul>
              <ul aria-label="조건" className="mt-6 space-y-1.5 border-t border-line pt-5 text-body-sm text-fg-3">
                {PRICE_TERMS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col border-t border-line pt-6 md:min-w-[18rem] md:border-l md:border-t-0 md:pl-12 md:pt-0">
              <p className="text-caption text-fg-3">부가세(VAT) 별도</p>
              <p className="tnum mt-2 text-[44px] font-extrabold leading-none tracking-[-0.035em] sm:text-[48px]">
                월 350만원
              </p>
              <p className="tnum mt-2 text-body-sm text-fg-3">₩3,500,000/월</p>
              <ContactButton className="mt-6 w-full" />
              <p className="mt-3 text-caption text-fg-3">야외·해외 촬영: 가격 협의</p>
            </div>
          </div>

          <p className="mt-6 text-caption text-fg-3">
            * 가격은 변동될 수 있으니 꼭 참고해주세요. 채널 상황에 따라 구성을 조정해 제안드립니다.
          </p>
        </div>
      </section>

      {/* ══ FAQ: 2단(왼쪽 제목 sticky) + 목록(DESIGN 6.21) ══ */}
      <section aria-labelledby="faq-title" className={SECTION}>
        <div className={cx(WRAP, PAD)}>
          <SectionHeader caption={CAPTION} label="FAQ" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5 lg:pr-8">
              <h2 id="faq-title" data-animate="up" className={cx(H2, "lg:sticky lg:top-[calc(var(--nav-h,56px)+2rem)]")}>
                자주 하시는 질문
              </h2>
            </div>
            <div className="lg:col-span-7">
              <StudioFaq items={C.faqs} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 최종 CTA: 홈 #contact 와 같은 원문·모양(DESIGN 7.3). '마감임박' 알약은 결정 6 기본 B 로 그 위에 유지 ══ */}
      <section aria-labelledby="final-cta-title">
        <div className="mx-auto max-w-wide px-6 pt-16 md:pb-8 md:pt-24 lg:px-8">
          <Link
            href={CONTACT_HREF}
            className="group inline-flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-control border border-line-strong px-4 py-2 transition-colors duration-150 hover:border-line-hover"
          >
            <span className="text-caption font-semibold text-owner-red">이번달 신규 대행 마감임박</span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-line-strong sm:block" />
            <span className="text-caption font-semibold text-fg transition-colors group-hover:text-fg-2">
              채널 대행 문의 남기기 <span aria-hidden="true">→</span>
            </span>
          </Link>
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-6">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3">
                <ChannelAvatar src={BIBL_AVATAR} size={48} className="size-12" />
                <div>
                  <p className="text-ui font-bold">비블 김태민</p>
                  <p className="text-caption text-fg-3">TMK STUDIO 대표</p>
                </div>
              </div>
              <h2
                id="final-cta-title"
                className="mt-8 text-h3 sm:text-[40px] sm:leading-[1.2] lg:text-h1 xl:text-[56px] xl:leading-[1.15]"
              >
                <span className="block text-fg-3">
                  지금 <span className="whitespace-nowrap">채널 대행을</span> 문의해보세요
                </span>
                <span className="block">비블이 직접 연락드립니다</span>
              </h2>
              <p className="mt-5 text-body text-fg-2 lg:text-lead">여러분의 채널에 맞는 대행 방향을 제안해드립니다.</p>
            </div>
            <div className="lg:col-span-4">
              <Link
                data-studio-cta
                href={CONTACT_HREF}
                className="inline-flex h-14 items-center justify-center whitespace-nowrap rounded-control bg-accent px-7 text-body font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active"
              >
                채널 대행 문의하기
              </Link>
              <p className="mt-3 flex items-center gap-1.5 text-caption text-fg-3">
                <CheckIcon size={16} />
                채널 URL 하나면 OK
              </p>
              <div className="mt-6 flex flex-col items-start border-t border-line pt-4">
                <Link
                  href="/studio/class/consulting"
                  className="inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2"
                >
                  1:1 팀비블 신청하기 <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg-2 transition-colors duration-150 hover:text-fg"
                >
                  가볍게 시작하려면 무료로 검색 시작하기 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 768 미만 하단 문의 바: 페이지 안 흰 '채널 대행 문의하기'가 보이는 동안은 숨는다 */}
      <BottomCTABar hideFrom="md" hideWhenVisible="[data-studio-cta]">
        <Link href={CONTACT_HREF} className={buttonClass({ size: "lg", block: true })}>
          채널 대행 문의하기
        </Link>
      </BottomCTABar>
    </main>
  );
}
