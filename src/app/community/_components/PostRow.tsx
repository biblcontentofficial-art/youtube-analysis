/**
 * 게시글 한 줄 (네이버 카페 스타일 촘촘한 리스트 행)
 * 순수 표시용 서버 컴포넌트.
 */

import Link from "next/link";
import { timeAgo, displayName, type CommunityPost } from "@/lib/community";

export default function PostRow({
  post,
  boardSlug,
  boardName,
  notice = false,
}: {
  post: Pick<
    CommunityPost,
    "id" | "title" | "author_name" | "created_at" | "view_count" | "like_count" | "comment_count"
  >;
  /** 링크에 사용할 게시판 slug */
  boardSlug: string;
  /** 홈처럼 여러 게시판이 섞인 목록에서만 표시 */
  boardName?: string | null;
  /** 공지 배지 표시 */
  notice?: boolean;
}) {
  return (
    <Link
      href={`/community/${boardSlug}/${post.id}`}
      className="group flex items-center gap-2.5 border-b border-white/[0.06] px-1 py-2.5 last:border-b-0 hover:bg-white/[0.02] sm:gap-3"
    >
      {notice && (
        <span className="shrink-0 rounded-md border border-[#00E5A0]/30 px-1.5 py-0.5 text-[11px] font-bold text-[#00E5A0]">
          공지
        </span>
      )}

      {boardName && (
        <span className="hidden w-20 shrink-0 truncate text-xs text-[#00E5A0] sm:block">
          {boardName}
        </span>
      )}

      <span className="min-w-0 flex-1 truncate text-sm text-neutral-200 group-hover:text-white">
        {post.title}
      </span>

      {post.comment_count > 0 && (
        <span className="shrink-0 text-xs font-bold text-[#00E5A0] tabular-nums">
          [{post.comment_count}]
        </span>
      )}

      <span className="hidden w-20 shrink-0 truncate text-right text-xs text-neutral-500 sm:block">
        {displayName(post.author_name)}
      </span>

      <span className="w-14 shrink-0 text-right text-xs text-neutral-500">
        {timeAgo(post.created_at)}
      </span>

      <span className="hidden w-16 shrink-0 text-right text-xs text-neutral-500 tabular-nums sm:block">
        조회 {post.view_count}
      </span>

      <span className="hidden w-16 shrink-0 text-right text-xs text-neutral-500 tabular-nums md:block">
        {post.like_count > 0 ? `좋아요 ${post.like_count}` : ""}
      </span>
    </Link>
  );
}
