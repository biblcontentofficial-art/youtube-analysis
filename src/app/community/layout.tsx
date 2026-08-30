/**
 * /community — 비블 커뮤니티 공통 레이아웃 (Skool형)
 * 커뮤니티 전체가 비블랩 회원 전용이다. 비로그인 방문자는 하위 페이지가
 * 렌더되기 전에 이 레이아웃에서 입장 게이트로 막힌다(글 제목·내용 일절 미노출).
 * 로그인 시: 헤더(타이틀 + 새 포스트) → 탭(커뮤니티/랭킹/소개) → 본문 + 우측 정보 카드.
 * 사이드 카드의 카테고리 링크 규약: /community?cat={slug}
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getBoards, getBoardCounts, getCommunityStats, getRecentBoardIds } from "@/lib/communityDb";
import { canModerateCommunity } from "@/lib/community";
import CommunityTabs from "./_components/CommunityTabs";
import CommunitySidebar from "./_components/CommunitySidebar";
import CommunityGate from "./_components/CommunityGate";
import VisitTracker from "./_components/VisitTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비블 커뮤니티",
  description: "비블랩 회원들의 유튜브·사업 공간",
  // 회원 전용 공간이라 검색엔진에 색인하지 않는다
  robots: { index: false, follow: false },
};

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const [user, boards, stats, counts, recentBoardIds] = await Promise.all([
    currentUser(),
    getBoards(),
    getCommunityStats(),
    getBoardCounts(),
    getRecentBoardIds(),
  ]);

  // 비로그인 → 입장 게이트 (하위 page.tsx는 렌더되지 않는다)
  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-screen-xl px-4 py-10 lg:py-16">
          <CommunityGate categories={boards.map((b) => b.name)} />
        </div>
      </div>
    );
  }

  const isModerator = canModerateCommunity({ email: user.email, plan: user.plan });

  return (
    <div className="min-h-screen bg-black">
      {/* 등업 조건(방문일) 집계 — 하루 1회 기록 */}
      <VisitTracker />
      <div className="mx-auto max-w-screen-xl px-4 py-6 lg:py-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white">비블 커뮤니티</h1>
            <p className="mt-1 text-xs text-neutral-500">유튜브로 사업을 키우는 사람들의 공간</p>
          </div>
          <Link
            href="/community/write"
            className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            새 포스트
          </Link>
        </div>

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
