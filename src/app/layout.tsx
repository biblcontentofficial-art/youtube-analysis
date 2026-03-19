import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SearchUsageBadge from "./_components/SearchUsageBadge";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Clerk은 실제 키가 있을 때만 로드
const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

export const metadata: Metadata = {
  title: "bibl lab - 유튜브 데이터 분석",
  description: "키워드로 유튜브 트렌드를 분석하세요",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let ClerkProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
  let NavUser: React.ComponentType | null = null;

  if (hasClerk) {
    const clerkModule = await import("@clerk/nextjs");
    ClerkProvider = clerkModule.ClerkProvider;
    const navUserModule = await import("./_components/NavUser");
    NavUser = navUserModule.default;
  }

  const content = (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-950 text-white`}>
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
                <NavTab href="/channels" icon="📺" label="채널 찾기" soon />
                <NavTab href="/trending" icon="📊" label="트렌드 분석" soon />
                <NavTab href="/saved" icon="🔖" label="수집한 영상" soon />
                <NavTab href="/pricing" icon="💳" label="요금제" />
              </div>
            </div>

            {/* 우측 */}
            <div className="flex items-center gap-2">
              <SearchUsageBadge />
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
      <span className="text-xs">{icon}</span>
      {label}
      {soon && (
        <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
          준비중
        </span>
      )}
    </a>
  );
}
