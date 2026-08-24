/**
 * /community/all — 전체글보기 (?page=2&q=검색어)
 * 네이버 카페 사이드바의 "전체글보기"에 대응하는 통합 최신순 피드.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getBoards, listFeed } from "@/lib/communityDb";
import { canReadBoard } from "@/lib/community";
import FeedList from "../_components/FeedList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "전체글보기 | 비블 커뮤니티",
  description: "비블 커뮤니티 전체 게시판 최신글",
};

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AllFeedPage({ searchParams }: Props) {
  const sp = await searchParams;

  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const q = (sp.q ?? "").trim();

  const [user, boards] = await Promise.all([currentUser(), getBoards()]);

  // 읽기 권한이 있는 게시판 id만 조회 대상에 넣는다.
  // 비로그인 방문자에게는 read_role='member' 게시판 id가 애초에 넘어가지 않으므로,
  // 회원 전용 게시판(자료실 등) 글은 목록·검색 결과·전체 개수 어디에도 나타나지 않는다.
  const readableIds = boards.filter((b) => canReadBoard(b, user)).map((b) => b.id);

  const { posts, total } = await listFeed(readableIds, { page, q, sort: "recent" });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white">전체글보기</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {user
              ? "내가 볼 수 있는 모든 게시판의 최신글"
              : "공개 게시판의 최신글 (회원 전용 게시판은 로그인 후 표시됩니다)"}
          </p>
        </div>

        {/* 검색 — 서버 렌더 GET 폼 (자바스크립트 없이도 동작) */}
        <form action="/community/all" method="get" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="제목·내용 검색"
            aria-label="전체글 검색"
            className="w-40 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none sm:w-52"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white hover:bg-neutral-700"
          >
            검색
          </button>
        </form>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>
          {q ? (
            <>
              <span className="text-[#00E5A0]">‘{q}’</span> 검색 결과 {total}건
            </>
          ) : (
            <>전체 {total}건</>
          )}
        </span>
        {q && (
          <Link href="/community/all" className="text-neutral-400 hover:text-white">
            검색 해제
          </Link>
        )}
      </div>

      <div className="mt-3">
        <FeedList posts={posts} total={total} page={page} basePath="/community/all" q={q} />
      </div>
    </div>
  );
}
