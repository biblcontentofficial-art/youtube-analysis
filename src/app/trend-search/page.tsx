import type { Metadata } from "next";
import TrackVisit from "@/app/_components/TrackVisit";
import Link from "next/link";
import { cx } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import {
  LIST_PANEL,
  LIST_PANEL_HEAD,
  LIST_PANEL_HEAD_META,
  LIST_PANEL_LIST,
  LIST_PANEL_TITLE,
} from "@/components/ui/list-panel";

export const metadata: Metadata = {
  title: "유튜브 트렌드 서치",
  description:
    "영상 찾기, 채널 찾기, 채널 분석, 영상 수집까지 비블랩의 유튜브 분석 도구를 한곳에서 사용하세요.",
  alternates: {
    canonical: "https://bibllab.com/trend-search",
  },
};

/** 잠긴 도구 표시(DESIGN 6.12 Pro 태그 한 모양, 자물쇠 아이콘 없음) */
const PLAN_TAG = "inline-flex items-center rounded border border-line-strong px-1 text-micro leading-[18px] text-fg-3";

/**
 * 항목 전체가 링크(누름 영역 44px 이상). hover 는 제목 밝기와 화살표만.
 * 640 미만은 오른쪽 32px 를 비워 제목·설명·화살표가 카카오 버튼 자리(오른쪽 76px)에 들어가지 않게 한다(DESIGN 6.17)
 */
const ITEM_LINK = "group flex min-h-11 items-center justify-between gap-4 py-3.5 pr-8 transition-colors duration-150 sm:pr-0";

/** 항목 설명: 모바일은 줄바꿈, 768 이상 한 줄(LIST_PANEL_DESC 와 같은 값에 줄바꿈만 다르게) */
const ITEM_DESC = "mt-0.5 block text-caption text-fg-3 md:truncate";

const ARROW = "transition-transform duration-150 group-hover:translate-x-0.5";

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
    },
    {
      title: "채널 찾기",
      desc: "주제·분야로 성장 중인 채널을 발견합니다. 구독자 급상승·신생 채널 필터를 제공합니다.",
      href: "/channels",
      locked: !isStarterPlus,
      plan: "Starter",
    },
    {
      title: "채널 분석",
      desc: "내 채널의 데이터를 분석해 개선 포인트를 확인합니다.",
      href: "/my-channel",
      locked: !isStarterPlus,
      plan: "Starter",
    },
    {
      title: "수집한 영상",
      desc: "마음에 드는 영상을 수집하고 CSV로 내보내 벤치마킹·레퍼런스 관리에 활용합니다.",
      href: "/saved",
      locked: !isProPlus,
      plan: "Pro",
    },
  ];

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <TrackVisit page="trend-search" />
      <div className="mx-auto w-full max-w-wide px-6 py-16 md:py-24 lg:px-8">
        <SectionHeader caption="bibl lab" label="TREND SEARCH" />

        <div className="max-w-3xl">
          <h1 className="text-h2 text-silver lg:text-h1">
            유튜브 <span className="text-accent">트렌드 서치</span>
          </h1>
          <p className="mt-4 text-ui text-fg-2 md:text-lead">
            키워드·채널·데이터 분석 도구를 한곳에서 사용하세요.
          </p>

          <div className={cx(LIST_PANEL.standalone, "mt-10 md:mt-12")}>
            <div className={LIST_PANEL_HEAD}>
              <h2 className="text-caption font-semibold text-fg">분석 도구 4가지</h2>
              <span className={LIST_PANEL_HEAD_META}>Free · Starter · Pro</span>
            </div>
            <ul className={LIST_PANEL_LIST}>
              {TOOLS.map((t) => (
                <li key={t.title}>
                  <Link href={t.locked ? "/pricing" : t.href} className={ITEM_LINK}>
                    <span className="min-w-0 flex-1">
                      <span className={cx(LIST_PANEL_TITLE, "transition-colors duration-150 group-hover:text-fg-2", t.locked ? "text-fg-3" : "text-fg")}>
                        {t.title}
                        {t.locked && <span className={PLAN_TAG}>{t.plan}</span>}
                      </span>
                      <span className={ITEM_DESC}>{t.desc}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-body-sm font-semibold text-fg-2">
                      {t.locked ? (
                        <>
                          <span className="sr-only">{t.plan}+ 필요, </span>
                          <span className="hidden sm:inline">요금제 보기</span>
                        </>
                      ) : (
                        <span className="sr-only">바로가기</span>
                      )}
                      <span aria-hidden="true" className={ARROW}>→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 브레이크아웃: 잠금 없음, 로그인 뒤 목록 */}
          <div className="mt-8 border-t border-line pt-6">
            <Link href="/trend-search/breakout" className="group inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2">
              브레이크아웃 <span aria-hidden="true" className={ARROW}>→</span>
            </Link>
            <p className="text-body-sm text-fg-3">주제와 상관없이 어제 올라온 영상 중 구독자 수에 비해 조회수가 잘 나온 영상을 매일 모아 봅니다.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
