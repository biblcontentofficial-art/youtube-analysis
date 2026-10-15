"use client";

/**
 * 브레이크아웃 구역 탭 줄(영상 · 급상승 키워드 · 지금 크는 채널 · 성장 추적 · 관심 목록).
 * 근거: DESIGN.md 6.3 도구 탭, docs/trend-dev/spec.md 1.1
 *
 *   <BreakoutTabs current="videos" />
 *   <BreakoutTabs current="watch" badge={3} />
 *
 * - 탭 하나는 ToolTabs.tsx 의 TOOL_TAB 과 같은 값(높이 44px · 768 이상 48px, 현재 탭 흰 2px 막대) + 안쪽 포커스 외곽선.
 *   tabs.ts 의 TAB(약 40px)은 쓰지 않는다. 바닥 선은 TAB_BAR, 가로 스크롤은 안쪽 nav(tabs.ts 주석과 같은 이유).
 * - 1024 미만은 짧은 라벨. ready:false 탭은 그리지 않는다(화면이 생기는 항목에서 true 로 바꾼다).
 * - badge: '관심 목록' 뒤 안 읽은 수(배지 상자 없이 글자만, 0이면 숨김). 다섯 탭 page 가 모두 넘긴다(T9).
 * - 섹션 머리(SectionHeader mb-10·md:mb-12) 바로 아래에 두는 줄이라 위 간격을 24px 로 줄인다(-mt-4·md:-mt-6).
 * - 클라이언트 잎인 이유는 하나: 좁은 화면에서 현재 탭이 가로 스크롤 밖에 있으면 마운트 때 보이게 옮긴다.
 *   로그인·플랜·데이터를 읽지 않는다.
 */
import Link from "next/link";
import { useEffect, useRef } from "react";
import { TAB_BAR } from "@/components/ui/tabs";

export type BreakoutTabKey = "videos" | "keywords" | "channels" | "growth" | "watch";

export const TREND_TABS: { key: BreakoutTabKey; href: string; label: string; short: string; ready: boolean }[] = [
  { key: "videos", href: "/trend-search/breakout", label: "영상", short: "영상", ready: true },
  { key: "keywords", href: "/trend-search/breakout/keywords", label: "급상승 키워드", short: "키워드", ready: false },
  { key: "channels", href: "/trend-search/breakout/channels", label: "지금 크는 채널", short: "크는 채널", ready: false },
  { key: "growth", href: "/trend-search/breakout/growth", label: "성장 추적", short: "성장", ready: false },
  { key: "watch", href: "/trend-search/breakout/watch", label: "관심 목록", short: "관심", ready: false },
];

/**
 * 탭 하나. ToolTabs.tsx TOOL_TAB 과 같은 값에 안쪽 포커스 외곽선 하나만 더한다.
 * nav 가 overflow-x-auto 라 바깥(offset 2px) 외곽선은 위아래·왼쪽이 잘린다(DESIGN 8 키보드 포커스). 그래서 안쪽 -2px.
 */
const TAB =
  "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent text-body-sm font-medium text-fg-3 transition-colors duration-150 hover:text-fg md:h-12 aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent focus-visible:outline-offset-[-2px]";

type TabItem = (typeof TREND_TABS)[number];

export function BreakoutTabs({ current, badge }: { current: BreakoutTabKey; badge?: number }) {
  return <BreakoutTabsView tabs={TREND_TABS.filter((t) => t.ready)} current={current} badge={badge} />;
}

/** 그리기만 하는 본체. 탭 목록을 받는다(로컬 미리보기에서 다섯 탭을 모두 넘겨 짧은 라벨·스크롤을 확인한다) */
export function BreakoutTabsView({ tabs, current, badge }: { tabs: TabItem[]; current: BreakoutTabKey; badge?: number }) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [current]);

  return (
    <div className={`${TAB_BAR} -mt-4 mb-8 md:-mt-6 md:mb-10`}>
      <nav ref={navRef} aria-label="브레이크아웃 메뉴" className="scrollbar-hide -mx-6 -mb-px flex gap-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} aria-current={t.key === current ? "page" : undefined} className={TAB}>
            {t.label === t.short ? (
              t.label
            ) : (
              <>
                <span className="hidden lg:inline">{t.label}</span>
                <span className="lg:hidden">{t.short}</span>
              </>
            )}
            {t.key === "watch" && badge != null && badge > 0 && (
              <span className="tnum text-caption text-fg-3"><span className="sr-only">안 읽은 영상 </span>{badge}</span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
