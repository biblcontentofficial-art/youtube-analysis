/**
 * /community — 비블 커뮤니티 공통 레이아웃
 * 좌측 사이드바(프로필·검색·게시판 메뉴) + 우측 본문 2단 구성.
 * 모바일에서는 사이드바가 본문 위로 접혀 올라간다.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { getBoards, getCommunityStats } from "@/lib/communityDb";
import BoardSidebar from "./_components/BoardSidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비블 커뮤니티",
  description: "비블랩 회원들의 유튜브·사업 공간",
};

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const [user, boards, stats] = await Promise.all([
    currentUser(),
    getBoards(),
    getCommunityStats(),
  ]);

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
