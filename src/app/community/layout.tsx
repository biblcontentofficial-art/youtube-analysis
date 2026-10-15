/**
 * /community — 비블 커뮤니티 공통 레이아웃 (Skool형)
 * 커뮤니티 전체가 비블랩 회원 전용이다. 비로그인 방문자는 하위 페이지가
 * 렌더되기 전에 이 레이아웃에서 입장 게이트로 막힌다(글 제목·내용 일절 미노출).
 * 로그인 시: 배너 → 머리(CommunityChrome: 타이틀 + 새 포스트) → 탭(커뮤니티/랭킹/소개) → 좌측 게시판 메뉴 + 본문.
 * 사이드 카드의 카테고리 링크 규약: /community?cat={slug}
 */

import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { getBoards, getBoardCounts, getCommunityStats, getRecentBoardIds } from "@/lib/communityDb";
import { canModerateCommunity, groupBoards } from "@/lib/community";
import CommunityTabs from "./_components/CommunityTabs";
import CommunitySidebar from "./_components/CommunitySidebar";
import CommunityGate from "./_components/CommunityGate";
import CommunityChrome from "./_components/CommunityChrome";
import VisitTracker from "./_components/VisitTracker";
import TrackVisit from "@/app/_components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비블 커뮤니티",
  description: "비블랩 회원들의 유튜브·사업 공간",
  // 회원 전용 공간이라 검색엔진에 색인하지 않는다
  robots: { index: false, follow: false },
};

/**
 * 게이트의 '멤버 N명 · 글 N개' 한 줄. Suspense 안에서 스트리밍한다.
 * getCommunityStats 는 React cache 라 레이아웃이 먼저 띄운 조회를 그대로 기다린다(새 조회 없음).
 */
async function GateStats() {
  let stats: { posts: number; members: number };
  try {
    stats = await getCommunityStats();
  } catch {
    return null;
  }
  if (!stats.members && !stats.posts) return null;
  return (
    <p className="tnum text-caption text-fg-3">
      멤버 <span className="font-semibold text-fg-1">{stats.members.toLocaleString("ko-KR")}</span>명
      {" · "}글 <span className="font-semibold text-fg-1">{stats.posts.toLocaleString("ko-KR")}</span>개
    </p>
  );
}

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  // 사이드바용 조회는 먼저 띄워 두되(로그인 사용자는 한 번에 병렬 처리),
  // 비로그인은 게이트만 그리면 되므로 기다리지 않고 빠져나간다.
  const statsP = getCommunityStats();
  const countsP = getBoardCounts();
  const recentP = getRecentBoardIds();
  // 게이트 분기에서 버려질 수 있으므로 미처리 거부를 막아 둔다
  statsP.catch(() => {});
  countsP.catch(() => {});
  recentP.catch(() => {});

  const [user, boards] = await Promise.all([currentUser(), getBoards()]);

  // 비로그인 → 입장 게이트 (하위 page.tsx는 렌더되지 않는다)
  if (!user) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-wide px-6 py-10 lg:px-8 lg:py-16">
          <CommunityGate
            groups={groupBoards(boards).map((g) => ({
              group: g.group,
              boards: g.boards.slice(0, 3).map((b) => b.name),
            }))}
            stats={
              <Suspense fallback={null}>
                <GateStats />
              </Suspense>
            }
          />
        </div>
      </div>
    );
  }

  const isModerator = canModerateCommunity({ email: user.email, plan: user.plan });
  const [stats, counts, recentBoardIds] = await Promise.all([statsP, countsP, recentP]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* 등업 조건(방문일) 집계 — 하루 1회 기록 */}
      <VisitTracker />
      <TrackVisit page="community" />
      {/* 커뮤니티 배너 (원본 비율 유지, 결정 5 기본: 모든 화면 그대로) */}
      <div className="mx-auto max-w-wide px-6 pt-4 lg:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/community-images/community-banner-bibl.png"
          alt="bibl"
          width={2000}
          height={629}
          className="h-auto w-full rounded-panel border border-line"
        />
      </div>

      <div className="mx-auto max-w-wide px-6 py-6 lg:px-8 lg:py-8">
        {/* 머리: /community 에서만 h1 */}
        <CommunityChrome />

        {/* 탭 */}
        <div className="mt-4">
          <CommunityTabs isModerator={isModerator} />
        </div>

        {/* 좌측 게시판 메뉴 (카페형) + 본문 */}
        <div className="mt-6 flex gap-7">
          <aside className="hidden w-64 shrink-0 lg:block">
            <CommunitySidebar
              boards={boards}
              stats={stats}
              counts={counts}
              recentBoardIds={recentBoardIds}
            />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
