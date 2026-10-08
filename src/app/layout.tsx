import type { Metadata, Viewport } from "next";
import Link from "next/link";
import NavigationLoader from "./_components/NavigationLoader";
import { ConfirmProvider } from "./_components/ConfirmDialog";
import SiteNav from "./_components/SiteNav";
import ReferralApply from "./_components/ReferralApply";
import KakaoChatButton from "./_components/KakaoChatButton";
import { Logo } from "@/components/ui/logo";
import { OG_DEFAULT, OG_IMAGE } from "@/lib/seo";
import "./globals.css";


// 모바일 브라우저 상단바·스크롤바·체크박스 같은 기본 컨트롤을 어두운 모양으로 (정적 값이라 정적 렌더 유지)
export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bibllab.com"),
  title: {
    default: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    template: "%s | 비블랩 (bibl lab)",
  },
  description:
    "비블, 비블랩(bibl lab) — 유튜브 키워드로 트렌드를 선점하세요. 조회수·구독자·게시일을 한눈에 확인하고, 성장하는 채널을 발견합니다. 유튜버·크리에이터를 위한 무료 데이터 도구.",
  keywords: [
    "비블", "비블랩", "비블 랩", "bibl lab", "bibllab",
    "유튜브 키워드 검색", "유튜브 트렌드", "유튜브 채널 찾기",
    "유튜브 조회수 확인", "유튜브 영상 검색",
    "크리에이터 도구", "유튜브 콘텐츠 전략", "유튜브 SEO",
    "유튜브 영상 수집", "콘텐츠 마케팅 도구",
  ],
  authors: [{ name: "bibl lab", url: "https://bibllab.com" }],
  creator: "bibl lab",
  publisher: "bibl lab",
  category: "technology",
  openGraph: {
    ...OG_DEFAULT,
    url: "https://bibllab.com",
    title: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    description:
      "비블랩 — 유튜브 키워드 트렌드 분석, 채널 찾기, 영상 수집. 크리에이터를 위한 데이터 인사이트.",
  },
  twitter: {
    card: "summary_large_image",
    title: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    description: "유튜브 키워드·채널 분석, 영상 수집. 크리에이터를 위한 무료 도구.",
    images: [OG_IMAGE.url],
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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon", sizes: "180x180" }],
  },
  verification: {
    google: "g0Ol1fn2l_gp_Acox_LXFgYsEL4aL5CQJmzWkqL3t0c",
    other: {
      "naver-site-verification": "6c22ffc7b10117b53128d7fce73aa52e26ce2857",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // dev 환경에서만 DevToolbar 로드 (프로덕션 번들에 포함되지 않음)
  let DevToolbar: React.ComponentType | null = null;
  if (process.env.NODE_ENV === "development") {
    DevToolbar = (await import("./_components/DevToolbar")).default;
  }

  // 주의: 이 레이아웃에서 auth()·cookies() 를 호출하면 사이트 전체가 동적 렌더로 떨어진다.
  // 네비의 경로 분기·현재 위치·사용자 표시는 SiteNav(클라이언트 잎)가 담당하므로 여기서는 인증을 읽지 않는다.

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "비블랩 (bibl lab)",
      alternateName: ["비블", "비블 랩", "bibl lab", "bibllab", "비블 랩 유튜브 분석"],
      url: "https://bibllab.com",
      description:
        "비블랩(bibl lab)은 유튜버·크리에이터를 위한 유튜브 키워드 검색 및 채널 찾기 SaaS 서비스입니다. YouTube API Services를 통해 공개된 조회수·구독자 수·게시일 등의 데이터를 한 곳에 정리해 보여줍니다.",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "YouTubeAnalytics",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      keywords: "유튜브 분석, 유튜브 키워드, 유튜브 채널 분석, 크리에이터 도구, 유튜브 트렌드, 비블, 비블랩",
      offers: [
        {
          "@type": "Offer",
          name: "Free 플랜",
          price: "0",
          priceCurrency: "KRW",
          description: "유튜브 영상 검색 2회/일, 채널 검색 1회/일 무료 제공",
        },
        {
          "@type": "Offer",
          name: "Starter 플랜",
          price: "15000",
          priceCurrency: "KRW",
          description: "영상 검색 50회/월, 채널 검색 30회/월, 검색 기록 30일 저장",
          billingIncrement: "P1M",
        },
        {
          "@type": "Offer",
          name: "Pro 플랜",
          price: "39000",
          priceCurrency: "KRW",
          description: "영상 검색 500회/월, 채널 검색 500회/월, 영상 수집·CSV 내보내기",
          billingIncrement: "P1M",
        },
        {
          "@type": "Offer",
          name: "Team bibl 플랜",
          price: "490000",
          priceCurrency: "KRW",
          description: "영상·채널 검색 무제한, 매주 1회 1:1 비블 컨설팅, 100강 VOD, 비블 오프라인 커뮤니티",
          billingIncrement: "P1M",
        },
      ],
      featureList: [
        "유튜브 키워드 검색",
        "유튜브 채널 찾기",
        "조회수·구독자 수·게시일 한눈에 보기",
        "영상 수집 및 CSV 내보내기",
        "검색 기록 저장 및 관리",
        "쇼츠·일반 영상 필터",
      ],
      screenshot: OG_IMAGE.url,
      softwareVersion: "2.0",
      datePublished: "2024-01-01",
      dateModified: "2026-03-26",
      provider: {
        "@type": "Organization",
        name: "세모골프",
        alternateName: "bibl lab",
        url: "https://bibllab.com",
        email: "bibl.content.official@gmail.com",
        telephone: "070-8027-2532",
        address: {
          "@type": "PostalAddress",
          streetAddress: "세화로 151번길 29-2 1층",
          addressLocality: "수원시 권선구",
          addressRegion: "경기도",
          postalCode: "16619",
          addressCountry: "KR",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "bibl.content.official@gmail.com",
          telephone: "070-8027-2532",
          contactType: "customer support",
          availableLanguage: "Korean",
          hoursAvailable: "Mo-Fr 10:00-18:00",
        },
        sameAs: [
          "https://www.youtube.com/@biblcontent",
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "47",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "비블랩(bibl lab)이란 무엇인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "비블랩(bibl lab)은 유튜버와 크리에이터를 위한 유튜브 키워드 검색·채널 찾기 SaaS 서비스입니다. YouTube API Services를 통해 공개된 영상 데이터를 키워드별로 수집해 조회수, 구독자 수, 게시일을 한 곳에서 확인할 수 있게 정리해 보여줍니다.",
          },
        },
        {
          "@type": "Question",
          name: "비블랩은 무료로 사용할 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, 비블랩은 무료 Free 플랜으로 시작할 수 있습니다. 하루 2회 영상 검색, 1회 채널 검색이 무료로 제공됩니다. 더 많은 검색이 필요하면 Starter(월 15,000원), Pro(월 39,000원), TEAM BIBL(월 490,000원) 플랜으로 업그레이드할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "유튜브 키워드 분석을 어떻게 사용하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "비블랩 메인 페이지에서 검색하고 싶은 유튜브 키워드를 입력하세요. 예: '캠핑', '영어 공부', '다이어트'. 검색하면 해당 키워드의 최신 유튜브 영상 목록과 함께 각 영상의 조회수, 채널 구독자 수, 게시일을 즉시 확인할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "비블랩이 제공하는 데이터는 무엇인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "비블랩은 YouTube API Services를 통해 공개된 데이터만 표시합니다. 영상 제목·설명, 조회수, 좋아요 수, 댓글 수, 채널명, 채널 구독자 수, 게시일 등이 포함됩니다. 비공식 메트릭은 제공하지 않습니다.",
          },
        },
        {
          "@type": "Question",
          name: "채널 찾기 기능은 무엇인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "채널 찾기는 특정 주제·분야에서 성장 중인 유튜브 채널을 발견하는 기능입니다. 구독자 급상승 채널, 신생 채널 필터를 통해 아직 덜 알려진 잠재력 있는 채널을 찾을 수 있습니다. Starter 플랜 이상에서 이용 가능합니다.",
          },
        },
        {
          "@type": "Question",
          name: "구독 취소는 어떻게 하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "마이페이지에서 '구독 취소' 버튼을 클릭하면 언제든지 취소할 수 있습니다. 취소 후에도 현재 결제 기간이 종료될 때까지 서비스를 계속 이용할 수 있으며, 다음 결제일부터 자동 갱신이 중단됩니다.",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "비블랩 (bibl lab)",
      alternateName: ["비블", "bibl lab", "bibllab"],
      url: "https://bibllab.com",
      logo: "https://bibllab.com/og-image.png",
      email: "bibl.content.official@gmail.com",
      telephone: "070-8027-2532",
      sameAs: [
        "https://www.youtube.com/@biblcontent",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: "https://bibllab.com" },
        { "@type": "ListItem", position: 2, name: "영상 찾기", item: "https://bibllab.com/search" },
        { "@type": "ListItem", position: 3, name: "채널 찾기", item: "https://bibllab.com/channels" },
        { "@type": "ListItem", position: 4, name: "비블의 칼럼", item: "https://bibllab.com/insights" },
        { "@type": "ListItem", position: 5, name: "요금제", item: "https://bibllab.com/pricing" },
        { "@type": "ListItem", position: 6, name: "스튜디오", item: "https://bibllab.com/studio" },
      ],
    },
  ];

  const content = (
    <html lang="ko">
      <head>
        {/* Pretendard Variable 자체 호스팅(unicode-range 조각이라 페이지에 필요한 글자 조각만 받는다) */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css" />
        {/* 아이콘 링크는 metadata.icons·app/icon.tsx·app/apple-icon.tsx 가 넣는다(수동 링크 중복 제거) */}
      </head>
      <body className="flex min-h-dvh flex-col bg-canvas text-fg">
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {/* 카카오 SDK 는 쓰는 곳(검색 결과 공유 버튼)에서만 싣는다: search/_components/ShareButton.tsx */}
        <NavigationLoader>
        <ConfirmProvider>
        {/* 건너뛰기 링크 + 전역 네비(body 바로 아래 header, BottomCTABar 가 이 위치로 찾는다) */}
        <SiteNav />
        <div id="content" tabIndex={-1} className="flex-1 focus:outline-0">
          {children}
        </div>
        <ReferralApply />
        <KakaoChatButton />
        {DevToolbar && <DevToolbar />}
        <SiteFooter />
        </ConfirmProvider>
        </NavigationLoader>
      </body>
    </html>
  );

  return content;
}

/** 푸터 링크(누름 영역 44px, 768 이상 32px · 터치 기기는 44px 유지) */
const FOOTER_LINK =
  "inline-flex h-11 min-w-11 items-center text-body-sm text-fg-3 transition-colors duration-150 hover:text-fg md:h-8 pointer-coarse:h-11";

const FOOTER_GROUPS: { title: string; items: { href: string; label: string; prefetch?: false }[] }[] = [
  {
    title: "비블과 함께",
    items: [
      { href: "/studio/class/consulting", label: "팀비블 1:1 유튜브 컨설팅", prefetch: false },
      { href: "/studio", label: "유튜브 채널 대행 문의" },
      { href: "/incubating", label: "브랜드 인큐베이팅" },
    ],
  },
  {
    title: "직접 하기",
    items: [
      { href: "/trend-search", label: "유튜브 트렌드 서치" },
      { href: "/community", label: "커뮤니티&자료" },
      { href: "/pricing", label: "요금제" },
    ],
  },
];

/** 푸터(DESIGN 6.16, 시안 home.html 865~915행). 정적 서버 렌더 */
function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-canvas">
      <div className="mx-auto max-w-wide px-6 pb-28 pt-12 lg:px-8 lg:py-16">
        <nav aria-label="푸터" className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-12 lg:gap-6">
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" aria-label="bibl lab 홈" className="inline-flex h-11 items-center rounded-md">
              <Logo variant="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-fg-3">유튜브 트렌드 분석 도구 · 크리에이터를 위한 데이터 인사이트</p>
          </div>
          {FOOTER_GROUPS.map((group, gi) => (
            <div key={group.title} className="lg:col-span-3">
              <p id={`footer-g${gi}`} className="text-caption font-semibold text-fg">{group.title}</p>
              <ul aria-labelledby={`footer-g${gi}`} className="mt-2 lg:mt-3">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} prefetch={item.prefetch} className={FOOTER_LINK}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 lg:col-span-2">
            <p id="footer-policy" className="text-caption font-semibold text-fg">정책</p>
            <ul aria-labelledby="footer-policy" className="mt-2 flex flex-wrap gap-x-5 lg:mt-3 lg:block">
              <li><Link href="/privacy" className={FOOTER_LINK}>개인정보처리방침</Link></li>
              <li><Link href="/terms" className={FOOTER_LINK}>이용약관</Link></li>
              <li><Link href="/refund" className={FOOTER_LINK}>환불정책</Link></li>
              <li><a href="mailto:bibl.content.official@gmail.com" className={FOOTER_LINK}>문의하기</a></li>
              <li>
                <a href="https://pf.kakao.com/_beBNn/chat" target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                  카카오톡 채널<span className="sr-only"> (새 창)</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <address className="mt-10 border-t border-line-soft pt-8 text-micro font-normal not-italic leading-[1.8] text-fg-3 lg:mt-12">
          <p className="font-semibold text-fg-2">
            <span className="whitespace-nowrap">세모골프</span> <span aria-hidden="true" className="text-fg-4">|</span>{" "}
            <span className="whitespace-nowrap">대표: 김태민</span>
          </p>
          <p>
            <span className="block whitespace-nowrap sm:inline">사업자등록번호: 315-47-01018</span>{" "}
            <span aria-hidden="true" className="hidden text-fg-4 sm:inline">|</span>{" "}
            <span className="block whitespace-nowrap sm:inline">통신판매업신고: 2023-수원권선-1549</span>
          </p>
          <p>
            <span className="whitespace-nowrap">주소: 경기도 수원시 권선구</span>{" "}
            <span className="whitespace-nowrap">세화로 151번길 29-2 1층 (우편번호 16619)</span>
          </p>
          <p>
            <span className="block whitespace-nowrap sm:inline">고객문의: bibl.content.official@gmail.com</span>{" "}
            <span aria-hidden="true" className="hidden text-fg-4 sm:inline">|</span>{" "}
            <span className="block whitespace-nowrap sm:inline">070-8027-2532</span>
          </p>
          <p>개인정보관리 책임자: 김태민</p>
        </address>
        <div className="mt-6 space-y-1.5 text-micro font-normal leading-[1.7] text-fg-3">
          <p>
            본 서비스는 YouTube API Services를 사용합니다. 이용 시{" "}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="py-[15px] underline decoration-fg-4 underline-offset-2 transition-colors duration-150 hover:text-fg">YouTube 서비스 약관</a>
            {" "}및{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="py-[15px] underline decoration-fg-4 underline-offset-2 transition-colors duration-150 hover:text-fg">Google 개인정보처리방침</a>
            에 동의한 것으로 간주됩니다.
          </p>
          <p>© {new Date().getFullYear()} 세모골프. All Rights Reserved. bibl lab은 세모골프의 서비스입니다.</p>
        </div>
      </div>
    </footer>
  );
}
