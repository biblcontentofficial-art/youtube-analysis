import type { Metadata } from "next";
import TrackVisit from "@/app/_components/TrackVisit";
import Link from "next/link";

export const metadata: Metadata = {
  title: "유튜브 트렌드 서치",
  description:
    "영상 찾기, 채널 찾기, 채널 분석, 영상 수집까지 비블랩의 유튜브 분석 도구를 한곳에서 사용하세요.",
  alternates: {
    canonical: "https://bibllab.com/trend-search",
  },
};

const ICON_CLASS = "w-7 h-7 text-white";

export default async function TrendSearchPage() {
  // 네비와 동일한 방식의 플랜 확인 (실패 시 무료 취급)
  let isStarterPlus = false;
  let isProPlus = false;
  try {
    const { auth, getUserPlan } = await import("@/lib/auth");
    const { userId } = await auth();
    if (userId) {
      const plan = (await getUserPlan(userId)).toLowerCase();
      isStarterPlus = ["starter", "pro", "business", "admin", "team"].includes(plan);
      isProPlus = ["pro", "business", "admin", "team"].includes(plan);
    }
  } catch { /* 기본값 false */ }

  const TOOLS = [
    {
      title: "영상 찾기",
      desc: "키워드로 최신 유튜브 영상을 수집해 조회수·구독자·게시일을 한눈에 확인합니다.",
      href: "/search",
      locked: false,
      plan: null as string | null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={ICON_CLASS}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      ),
    },
    {
      title: "채널 찾기",
      desc: "주제·분야로 성장 중인 채널을 발견합니다. 구독자 급상승·신생 채널 필터를 제공합니다.",
      href: "/channels",
      locked: !isStarterPlus,
      plan: "Starter",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={ICON_CLASS}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "채널 분석",
      desc: "내 채널의 데이터를 분석해 개선 포인트를 확인합니다.",
      href: "/my-channel",
      locked: !isStarterPlus,
      plan: "Starter",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={ICON_CLASS}>
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      title: "수집한 영상",
      desc: "마음에 드는 영상을 수집하고 CSV로 내보내 벤치마킹·레퍼런스 관리에 활용합니다.",
      href: "/saved",
      locked: !isProPlus,
      plan: "Pro",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={ICON_CLASS}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <TrackVisit page="trend-search" />
      <div className="max-w-screen-lg mx-auto px-4 py-16 md:py-24">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-12">
          <span className="text-xs md:text-sm text-neutral-500">bibl lab</span>
          <span className="text-sm md:text-base font-black tracking-[0.25em] text-white">TREND SEARCH</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">유튜브 트렌드 서치</h1>
        <p className="text-neutral-400 text-base md:text-lg mb-12">
          키워드·채널·데이터 분석 도구를 한곳에서 사용하세요.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {TOOLS.map((t) => (
            <Link
              key={t.title}
              href={t.locked ? "/pricing" : t.href}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8 hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-5">
                {t.icon}
                {t.locked && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-neutral-700 text-neutral-400 leading-none">
                    {t.plan}+ 필요
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-2">{t.title}</h2>
              <p className="text-sm md:text-base text-neutral-400 leading-relaxed">{t.desc}</p>
              <p className="mt-5 text-sm font-semibold text-white">
                {t.locked ? "요금제 보기 →" : "바로가기 →"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
