import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SearchUsageBadge from "./_components/SearchUsageBadge";
import NavigationLoader from "./_components/NavigationLoader";
import { ConfirmProvider } from "./_components/ConfirmDialog";
import NavUser from "./_components/NavUser";
import ReferralApply from "./_components/ReferralApply";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bibllab.com"),
  title: {
    default: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    template: "%s | 비블랩 (bibl lab)",
  },
  description:
    "비블, 비블랩(bibl lab) — 유튜브 키워드로 트렌드를 선점하세요. 조회수·구독자·반응도를 한눈에 분석하고, 성장하는 채널을 발견합니다. 유튜버·크리에이터를 위한 무료 데이터 분석 도구.",
  keywords: [
    "비블", "비블랩", "비블 랩", "bibl lab", "bibllab",
    "유튜브 분석", "유튜브 키워드 분석", "유튜브 트렌드", "유튜브 채널 찾기",
    "유튜브 반응도", "유튜브 조회수 분석", "유튜브 영상 검색", "유튜브 아웃라이어",
    "크리에이터 도구", "유튜브 콘텐츠 전략", "유튜브 SEO", "구독자 분석",
    "유튜브 채널 분석", "유튜브 영상 수집", "콘텐츠 마케팅 도구",
  ],
  authors: [{ name: "bibl lab", url: "https://bibllab.com" }],
  creator: "bibl lab",
  publisher: "bibl lab",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://bibllab.com",
    siteName: "비블랩 (bibl lab)",
    title: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    description:
      "비블랩 — 유튜브 키워드 트렌드 분석, 채널 찾기, 영상 수집. 크리에이터를 위한 데이터 인사이트.",
    images: [
      {
        url: "https://bibllab.com/og-image.png",
        width: 1280,
        height: 720,
        alt: "비블랩 - 유튜브 키워드·채널 분석 도구",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    description: "유튜브 키워드·채널 분석, 영상 수집. 크리에이터를 위한 무료 도구.",
    images: ["https://bibllab.com/og-image.png"],
  },
  alternates: {
    canonical: "https://bibllab.com",
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
  let isStarterPlus = false;
  let isProPlus = false;

  // dev 환경에서만 DevToolbar 로드 (프로덕션 번들에 포함되지 않음)
  let DevToolbar: React.ComponentType | null = null;
  if (process.env.NODE_ENV === "development") {
    DevToolbar = (await import("./_components/DevToolbar")).default;
  }

  // Supabase Auth에서 플랜 확인
  try {
    const { auth, getUserPlan } = await import("@/lib/auth");
    const { userId } = await auth();
    if (userId) {
      const plan = (await getUserPlan(userId)).toLowerCase();
      isStarterPlus = ["starter", "pro", "business", "admin", "team"].includes(plan);
      isProPlus = ["pro", "business", "admin", "team"].includes(plan);
    }
  } catch { /* auth 실패 시 기본값 false */ }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "비블랩 (bibl lab)",
      alternateName: ["비블", "비블 랩", "bibl lab", "bibllab", "비블 랩 유튜브 분석"],
      url: "https://bibllab.com",
      description:
        "비블랩(bibl lab)은 유튜버·크리에이터를 위한 유튜브 키워드 분석, 채널 찾기, 영상 반응도 분석 SaaS 서비스입니다. 조회수·구독자 비율로 영상 성과를 Good/Normal/Bad로 즉시 판단하고, 성장 중인 채널을 발견합니다.",
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
          price: "310000",
          priceCurrency: "KRW",
          description: "영상·채널 검색 무제한, 매주 1회 1:1 비블 컨설팅, 160강 VOD, 비블 오프라인 커뮤니티",
          billingIncrement: "P1M",
        },
      ],
      featureList: [
        "유튜브 키워드 검색 및 트렌드 분석",
        "영상 반응도 Good/Normal/Bad 판단",
        "조회수 아웃라이어 탐지",
        "알고리즘 상승 확률 분석",
        "유튜브 채널 찾기 및 성장 채널 발견",
        "영상 수집 및 CSV 내보내기",
        "검색 기록 저장 및 관리",
        "쇼츠·일반 영상 필터",
      ],
      screenshot: "https://bibllab.com/opengraph-image",
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
            text: "비블랩(bibl lab)은 유튜버와 크리에이터를 위한 유튜브 키워드 분석 SaaS 서비스입니다. 키워드를 검색하면 최신 유튜브 영상 데이터를 실시간으로 수집하고, 조회수·구독자 비율 기반의 반응도(Good/Normal/Bad), 아웃라이어 탐지, 알고리즘 상승 확률을 분석해줍니다.",
          },
        },
        {
          "@type": "Question",
          name: "비블랩은 무료로 사용할 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, 비블랩은 무료 Free 플랜으로 시작할 수 있습니다. 하루 2회 영상 검색, 1회 채널 검색이 무료로 제공됩니다. 더 많은 검색이 필요하면 Starter(월 15,000원), Pro(월 39,000원), Team bibl(월 310,000원) 플랜으로 업그레이드할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "유튜브 키워드 분석을 어떻게 사용하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "비블랩 메인 페이지에서 분석하고 싶은 유튜브 키워드를 입력하세요. 예: '캠핑', '영어 공부', '다이어트'. 검색하면 해당 키워드의 최신 유튜브 영상 목록과 함께 각 영상의 반응도(Good/Normal/Bad), 조회수, 구독자 수, 알고리즘 상승 확률을 즉시 확인할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "반응도(Good/Normal/Bad)는 어떻게 계산되나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "반응도는 채널의 구독자 수 대비 영상 조회수 비율로 계산됩니다. 구독자 수보다 훨씬 많은 조회수를 기록한 영상은 알고리즘 추천을 받은 아웃라이어로 'Good' 등급을 받습니다. 이를 통해 어떤 주제와 형식이 유튜브 알고리즘에서 잘 작동하는지 파악할 수 있습니다.",
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
        { "@type": "ListItem", position: 4, name: "스레드 분석", item: "https://bibllab.com/threads" },
        { "@type": "ListItem", position: 5, name: "요금제", item: "https://bibllab.com/pricing" },
        { "@type": "ListItem", position: 6, name: "스튜디오", item: "https://bibllab.com/studio" },
      ],
    },
  ];

  const content = (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nk" crossOrigin="anonymous" async />
        <link rel="icon" href="/icon" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon" sizes="180x180" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-white`}>
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if(typeof Kakao!=='undefined'&&!Kakao.isInitialized()){
                Kakao.init('${process.env.NEXT_PUBLIC_KAKAO_JS_KEY || ""}');
              }
            `,
          }}
        />
        <NavigationLoader>
        <ConfirmProvider>
        <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between min-w-0 overflow-x-auto scrollbar-hide">
            {/* 로고 + 탭 */}
            <div className="flex items-center gap-6 shrink-0">
              <a href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
                  <span style={{ color: "white", fontSize: 18, fontWeight: 900, lineHeight: 1, fontFamily: "sans-serif" }}>B</span>
                </div>
                <span className="font-bold text-base tracking-tight">
                  <span className="text-white">bibl</span>
                  <span className="text-teal-400"> lab</span>
                </span>
              </a>

              <div className="hidden md:flex items-center gap-1 text-sm whitespace-nowrap">
                {/* 영상 찾기 */}
                <NavTab href="/search" label="영상 찾기" icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                } />
                {/* 채널 찾기 */}
                <NavTab href="/channels" label="채널 찾기" requiredPlan={!isStarterPlus ? "Starter" : undefined} icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                } />
                {/* 채널 분석 */}
                <NavTab href="/my-channel" label="채널 분석" requiredPlan={!isStarterPlus ? "Starter" : undefined} icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                } />
                {/* 수집한 영상 */}
                <NavTab href="/saved" label="수집한 영상" requiredPlan={!isProPlus ? "Pro" : undefined} icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                  </svg>
                } />
                {/* 내 Threads 분석 — 준비중 */}
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-600 cursor-not-allowed select-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-gray-600">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  내 Threads 분석
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none bg-gray-800 text-gray-500 border border-gray-700">준비중</span>
                </span>
                {/* 요금제 */}
                <NavTab href="/pricing" label="요금제" icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                } />
                <>
                  <div className="w-px h-4 bg-gray-700 mx-1" />
                  <NavTab href="/studio/class/team-bibl" label="팀비블 1:1 유튜브 컨설팅" isStudio />
                  <NavTab href="/studio" label="올인원 유튜브 채널 대행" isStudio />
                </>
              </div>
            </div>

            {/* 우측 */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <SearchUsageBadge />
              {/* 모바일 전용: 요금제 링크 */}
              <a
                href="/pricing"
                className="md:hidden text-xs text-gray-400 hover:text-white px-2 py-1 rounded-md transition"
                title="요금제"
              >
                요금제
              </a>
              <NavUser />
            </div>
          </div>
          {/* 모바일 전용: 스튜디오 링크 행 */}
          <div className="md:hidden border-t border-gray-800/60 bg-gray-950">
            <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
              <a
                href="/studio/class/team-bibl"
                className="text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-md whitespace-nowrap"
              >
                팀비블 1:1 컨설팅
              </a>
              <span className="w-px h-3 bg-gray-700" />
              <a
                href="/studio"
                className="text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-md whitespace-nowrap"
              >
                올인원 채널 대행
              </a>
            </div>
          </div>
        </nav>
        {children}
        <ReferralApply />
        {DevToolbar && <DevToolbar />}
        <footer className="border-t border-gray-800 bg-gray-950 mt-16">

          <div className="max-w-screen-xl mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              {/* 브랜드 */}
              <div className="shrink-0">
                <a href="/" className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-black border border-gray-700 rounded-md flex items-center justify-center">
                    <span style={{ color: "white", fontSize: 16, fontWeight: 900, lineHeight: 1, fontFamily: "sans-serif" }}>B</span>
                  </div>
                  <span className="font-bold text-sm tracking-tight">
                    <span className="text-white">bibl</span>
                    <span className="text-teal-400"> lab</span>
                  </span>
                </a>
                <p className="text-xs text-gray-600 max-w-xs">유튜브 트렌드 분석 도구 — 크리에이터를 위한 데이터 인사이트</p>
              </div>

              {/* 사업자 정보 */}
              <div className="text-xs text-gray-600 space-y-1 leading-relaxed">
                <p className="font-medium text-gray-500">세모골프 &nbsp;|&nbsp; 대표: 김태민</p>
                <p>사업자등록번호: 315-47-01018 &nbsp;|&nbsp; 통신판매업신고: 2023-수원권선-1549</p>
                <p>주소: 경기도 수원시 권선구 세화로 151번길 29-2 1층 (우편번호 16619)</p>
                <p>고객문의: bibl.content.official@gmail.com &nbsp;|&nbsp; 070-8027-2532</p>
                <p>개인정보관리 책임자: 김태민</p>
              </div>

              {/* 링크 */}
              <div className="flex flex-col gap-2 text-xs shrink-0">
                <a href="/privacy" className="text-gray-500 hover:text-gray-300 transition">개인정보처리방침</a>
                <a href="/terms" className="text-gray-500 hover:text-gray-300 transition">이용약관</a>
                <a href="/refund" className="text-gray-500 hover:text-gray-300 transition">환불정책</a>
                <a href="mailto:bibl.content.official@gmail.com" className="text-gray-500 hover:text-gray-300 transition">문의하기</a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-900 text-xs text-gray-700 text-center">
              © {new Date().getFullYear()} 세모골프. All Rights Reserved. bibl lab은 세모골프의 서비스입니다.
            </div>
          </div>
        </footer>
        </ConfirmProvider>
        </NavigationLoader>
      </body>
    </html>
  );

  return content;
}

function NavTab({
  href,
  label,
  icon,
  requiredPlan,
  isStudio,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  requiredPlan?: "Starter" | "Pro";
  isStudio?: boolean;
}) {
  const locked = !!requiredPlan;

  const planStyle: Record<string, string> = {
    Starter: "bg-amber-950/60 text-amber-400 border border-amber-800/70",
    Pro:     "bg-purple-950/60 text-purple-400 border border-purple-800/70",
  };

  if (isStudio) {
    return (
      <a
        href={href}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition text-teal-400 hover:text-teal-300 hover:bg-teal-950/40 font-medium"
      >
        {icon}
        {label}
      </a>
    );
  }

  return (
    <a
      href={locked ? "/pricing" : href}
      title={locked ? `${requiredPlan} 플랜 이상에서 이용 가능` : undefined}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition group ${
        locked
          ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {locked && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-gray-500">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      {!locked && icon}
      {label}
      {locked && requiredPlan && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${planStyle[requiredPlan]}`}>
          {requiredPlan}+
        </span>
      )}
    </a>
  );
}
