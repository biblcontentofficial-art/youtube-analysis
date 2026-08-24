/**
 * /community — 비블 커뮤니티 공통 레이아웃
 * 커뮤니티 전체가 비블랩 회원 전용이다. 비로그인 방문자는 하위 페이지가
 * 렌더되기 전에 이 레이아웃에서 입장 게이트로 막힌다(글 제목·내용 일절 미노출).
 * 로그인 시: 좌측 사이드바(프로필·검색·게시판 메뉴) + 우측 본문 2단 구성.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { getBoards, getCommunityStats } from "@/lib/communityDb";
import { groupBoards } from "@/lib/community";
import BoardSidebar from "./_components/BoardSidebar";
import CommunityGate from "./_components/CommunityGate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비블 커뮤니티",
  description: "비블랩 회원들의 유튜브·사업 공간",
  // 회원 전용 공간이라 검색엔진에 색인하지 않는다
  robots: { index: false, follow: false },
};

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const [user, boards, stats] = await Promise.all([
    currentUser(),
    getBoards(),
    getCommunityStats(),
  ]);

  // 비로그인 → 입장 게이트 (하위 page.tsx는 렌더되지 않는다)
  if (!user) {
    const groups = groupBoards(boards).map((g) => g.group);
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-screen-xl px-4 py-10 lg:py-16">
          <CommunityGate groups={groups} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-screen-xl px-4 py-6 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-7">
          <BoardSidebar boards={boards} stats={stats} isLoggedIn={!!user} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
