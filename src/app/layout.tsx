import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SearchUsageBadge from "./_components/SearchUsageBadge";
import NavigationLoader from "./_components/NavigationLoader";
import { ConfirmProvider } from "./_components/ConfirmDialog";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Clerk은 실제 키가 있을 때만 로드
const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

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
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "비블랩 - 유튜브 키워드·채널 분석 도구",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구",
    description: "유튜브 키워드·채널 분석, 영상 수집. 크리에이터를 위한 무료 도구.",
    images: ["/opengraph-image"],
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
  verification: {
    google: "g0Ol1fn2l_gp_Acox_LXFgYsEL4aL5CQJmzWkqL3t0c",
    other: {
      "naver-site-verification": "e4fe1dae390bc105031e479a0df74e439757caba",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let ClerkProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
  let NavUser: React.ComponentType | null = null;
  let isStarterPlus = false;
  let isProPlus = false;

  if (hasClerk) {
    const clerkModule = await import("@clerk/nextjs");
    const { koKR } = await import("@clerk/localizations");
    const BaseClerkProvider = clerkModule.ClerkProvider;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ClerkProvider = ({ children }) => (
      <BaseClerkProvider localization={koKR as any}>{children}</BaseClerkProvider>
    );
    const navUserModule = await import("./_components/NavUser");
    NavUser = navUserModule.default;

    // 플랜 확인 → nav 잠금 해제
    // currentUser()로 최신 publicMetadata 읽음 (sessionClaims JWT에는 publicMetadata 미포함)
    try {
      const { currentUser } = await import("@clerk/nextjs/server");
      const user = await currentUser();
      const plan = (user?.publicMetadata?.plan as string) ?? "";
      isStarterPlus = ["starter", "pro", "business", "admin"].includes(plan);
      isProPlus = ["pro", "business", "admin"].includes(plan);
    } catch { /* auth 실패 시 기본값 false */ }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "비블랩 (bibl lab)",
    alternateName: ["비블", "비블 랩", "bibl lab", "bibllab"],
    url: "https://bibllab.com",
    description:
      "유튜브 키워드 트렌드 분석, 채널 찾기, 영상 수집 도구. 크리에이터를 위한 데이터 인사이트.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "ko-KR",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "KRW",
      lowPrice: "0",
      offerCount: "4",
    },
    provider: {
      "@type": "Organization",
      name: "세모골프",
      url: "https://bibllab.com",
      contactPoint: {
        "@type": "ContactPoint",
        email: "bibl.content.official@gmail.com",
        contactType: "customer support",
        availableLanguage: "Korean",
      },
    },
    featureList: [
      "유튜브 키워드 분석",
      "유튜브 채널 찾기",
      "영상 반응도 분석",
      "조회수 아웃라이어 탐지",
      "영상 수집 및 CSV 내보내기",
      "알고리즘 상승 확률 분석",
    ],
  };

  const content = (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NavigationLoader>
        <ConfirmProvider>
        <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
          <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* 로고 + 탭 */}
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </div>
                <span className="font-bold text-base tracking-tight">
                  <span className="text-white">bibl</span>
                  <span className="text-teal-400"> lab</span>
                </span>
              </a>

              <div className="hidden md:flex items-center gap-1 text-sm">
                <NavTab href="/search" icon="🎬" label="영상 찾기" />
                <NavTab href="/channels" icon="📺" label="채널 찾기" soon={!isStarterPlus} />
                <NavTab href="/saved" icon="🔖" label="수집한 영상" soon={!isProPlus} />
                <NavTab href="/pricing" icon="💳" label="요금제" />
              </div>
            </div>

            {/* 우측 */}
            <div className="flex items-center gap-2">
              <SearchUsageBadge />
              {/* 모바일 전용: 요금제 링크 */}
              <a
                href="/pricing"
                className="md:hidden text-xs text-gray-400 hover:text-white px-2 py-1 rounded-md transition"
                title="요금제"
              >
                요금제
              </a>
              {NavUser ? (
                <NavUser />
              ) : (
                <a
                  href="/sign-in"
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-md transition font-medium"
                >
                  로그인
                </a>
              )}
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-800 bg-gray-950 mt-16">

          <div className="max-w-screen-xl mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              {/* 브랜드 */}
              <div className="shrink-0">
                <a href="/" className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-black border border-gray-700 rounded-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
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

  if (ClerkProvider) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}

function NavTab({ href, icon, label, soon }: { href: string; icon: string; label: string; soon?: boolean }) {
  return (
    <a
      href={soon ? "#" : href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
        soon
          ? "text-gray-600 cursor-default"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {label}
      {soon && (
        <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
          준비중
        </span>
      )}
    </a>
  );
}
