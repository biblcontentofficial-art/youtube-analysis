/**
 * Skool형 피드 카드 (서버 컴포넌트)
 * 아바타(이니셜)+레벨 배지 · 작성자/카테고리/시각 · 제목 · 본문 미리보기 · 반응 수.
 * 카드 전체가 글 상세 링크다.
 */

import Link from "next/link";
import { excerpt, levelForPoints, timeAgo, type PostSummary } from "@/lib/community";

interface Props {
  post: PostSummary;
  points?: number;
  pinned?: boolean;
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function FeedCard({ post, points = 0, pinned = false }: Props) {
  const level = levelForPoints(points);
  const initial = (post.author_name ?? "").trim().charAt(0) || "비";
  const isNotice = pinned || post.is_notice;
  const href = post.board ? `/community/${post.board.slug}/${post.id}` : "/community";

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-600"
    >
      <div className="flex gap-3.5">
        {/* 아바타 + 레벨 배지 (Skool 방식: 우하단 겹침) */}
        <div className="relative h-9 w-9 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">
            {initial}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5A0] text-[9px] font-black text-black"
            title={`LV.${level}`}
            aria-label={`레벨 ${level}`}
          >
            {level}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* 작성자 · 카테고리 · 시각 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {isNotice && (
              <span className="rounded border border-neutral-700 px-1.5 text-[10px] font-bold leading-4 text-[#00E5A0]">
                공지
              </span>
            )}
            <span className="truncate text-sm font-semibold text-white">{post.author_name}</span>
            <span className="text-xs text-neutral-500">
              {post.board ? `${post.board.name} · ` : ""}
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* 제목 */}
          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-white md:text-base">
            {post.title}
          </h3>

          {/* 본문 미리보기 */}
          {post.content && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-400">
              {excerpt(post.content, 140)}
            </p>
          )}

          {/* 반응 수 (0이어도 표시) */}
          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <HeartIcon />
              {post.like_count}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <CommentIcon />
              {post.comment_count}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <EyeIcon />
              조회 {post.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
