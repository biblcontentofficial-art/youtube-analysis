/**
 * /community/popular — 인기글 (?page=2&q=검색어)
 * 네이버 카페 사이드바의 "인기글"에 대응하는 통합 피드. 최근 30일 좋아요·조회수 기준.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getBoards, listFeed } from "@/lib/communityDb";
import { canReadBoard } from "@/lib/community";
import FeedList from "../_components/FeedList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "인기글 | 비블 커뮤니티",
  description: "최근 30일 좋아요·조회수 기준 비블 커뮤니티 인기글",
};

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function PopularFeedPage({ searchParams }: Props) {
  const sp = await searchParams;

  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const q = (sp.q ?? "").trim();

  const [user, boards] = await Promise.all([currentUser(), getBoards()]);

  // 전체글보기와 동일하게 읽기 권한이 있는 게시판 id만 넘긴다.
  // 비로그인 방문자에게는 회원 전용 게시판 글이 애초에 조회되지 않는다.
  const readableIds = boards.filter((b) => canReadBoard(b, user)).map((b) => b.id);

  const { posts, total } = await listFeed(readableIds, { page, q, sort: "popular" });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white">인기글</h1>
          <p className="mt-1 text-sm text-neutral-400">최근 30일 좋아요·조회수 기준</p>
        </div>
        <Link
          href="/community/all"
          className="shrink-0 text-xs text-neutral-400 hover:text-white"
        >
          전체글보기 &gt;
        </Link>
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
          <Link href="/community/popular" className="text-neutral-400 hover:text-white">
            검색 해제
          </Link>
        )}
      </div>

      <div className="mt-3">
        <FeedList posts={posts} total={total} page={page} basePath="/community/popular" q={q} />
      </div>
    </div>
  );
}
