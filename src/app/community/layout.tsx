/**
 * /community — 비블 커뮤니티 공통 레이아웃
 * 좌측 게시판 사이드바(데스크톱) + 상단 가로 칩(모바일) + 본문 2단 구성.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getBoards } from "@/lib/communityDb";
import { groupBoards } from "@/lib/community";
import BoardSidebar from "./_components/BoardSidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비블 커뮤니티",
  description: "유튜브·사업 하는 사람들의 커뮤니티",
};

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const [user, boards] = await Promise.all([currentUser(), getBoards()]);
  const groups = groupBoards(boards);

  const writeHref = user
    ? "/community/write"
    : `/sign-in?next=${encodeURIComponent("/community/write")}`;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-screen-lg px-4 py-10">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/community"
              className="text-2xl font-bold tracking-tight text-white"
            >
              비블 커뮤니티
            </Link>
            <p className="mt-1 text-sm text-neutral-400">
              유튜브·사업 하는 사람들의 커뮤니티
            </p>
          </div>
          <Link
            href={writeHref}
            className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-neutral-200"
          >
            글쓰기
          </Link>
        </div>

        {/* 모바일 게시판 칩 */}
        <BoardSidebar groups={groups} variant="mobile" />

        {/* 본문 2단 */}
        <div className="mt-6 flex gap-8 lg:mt-8">
          <BoardSidebar groups={groups} variant="desktop" />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
