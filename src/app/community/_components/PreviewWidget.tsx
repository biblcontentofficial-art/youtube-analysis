/**
 * 카페형 게시판 미리보기 위젯 (서버 컴포넌트)
 *
 * variant="list" — 카페 게시판 미리보기: 공지 먼저 + 제목 + [댓글수] + 조회수
 * variant="card" — 칼럼 미리보기: 제목 2줄 + 본문 발췌 2줄 + 작성자·시간·조회수
 *
 * 읽기 권한 필터는 호출부(page.tsx)에서 canReadBoard로 이미 끝난 상태로 들어온다.
 * 이 컴포넌트는 받은 글만 그린다.
 */

import Link from "next/link";
import {
  type Board,
  type CommunityPost,
  displayName,
  excerpt,
  timeAgo,
} from "@/lib/community";

const MAX_LIST_ROWS = 6;
const MAX_CARD_ITEMS = 4;

export interface PreviewWidgetProps {
  board: Board;
  posts: CommunityPost[];
  notices: CommunityPost[];
  variant: "list" | "card";
}

export default function PreviewWidget({
  board,
  posts,
  notices,
  variant,
}: PreviewWidgetProps) {
  const limit = variant === "card" ? MAX_CARD_ITEMS : MAX_LIST_ROWS;
  const rows = [...notices, ...posts].slice(0, limit);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <Link
          href={`/community/${board.slug}`}
          className="min-w-0 truncate text-base font-bold tracking-tight text-white hover:text-[#66FFCC]"
        >
          {board.name}
        </Link>
        <Link
          href={`/community/${board.slug}`}
          className="shrink-0 text-xs text-neutral-500 hover:text-white"
        >
          더보기 &gt;
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-600">아직 글이 없습니다</p>
      ) : variant === "card" ? (
        <div>
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/community/${board.slug}/${p.id}`}
              className="group block border-b border-white/[0.06] px-4 py-3 last:border-b-0 hover:bg-white/[0.02]"
            >
              <p className="line-clamp-2 text-sm font-bold leading-snug text-white">
                {p.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-400">
                {excerpt(p.content, 80)}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-neutral-500">
                <span className="truncate">{displayName(p.author_name)}</span>
                <span aria-hidden="true">·</span>
                <span>{timeAgo(p.created_at)}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">조회 {p.view_count}</span>
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div>
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/community/${board.slug}/${p.id}`}
              className="group flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 last:border-b-0 hover:bg-white/[0.02]"
            >
              {p.is_notice && (
                <span className="shrink-0 rounded border border-neutral-700 px-1.5 text-[11px] leading-[18px] text-[#00E5A0]">
                  공지
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-200 group-hover:text-white">
                {p.title}
              </span>
              {p.comment_count > 0 && (
                <span className="shrink-0 text-[11px] tabular-nums text-[#00E5A0]">
                  [{p.comment_count}]
                </span>
              )}
              <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                <span className="sr-only">조회수 </span>
                {p.view_count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
