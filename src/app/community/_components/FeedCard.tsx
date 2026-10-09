/**
 * Skool형 피드 카드 (서버 컴포넌트)
 * 아바타(이니셜)+레벨 배지 · '작성자 · 시각' · 제목 · 본문 미리보기 · 게시판 이름 + 반응 수(오른쪽 끝).
 * 본문에 사진이 있으면 오른쪽에 72px 정사각 썸네일. 카드 전체가 글 상세 링크다.
 * 피드는 읽기 권한이 있는 게시판의 글만 받으므로(listFeed) 썸네일도 권한 검사를 통과한 본문에서만 나온다.
 */

import Link from "next/link";
import { timeAgo, toPreviewText, type MemberGrade, type PostSummary } from "@/lib/community";
import MemberAvatar from "./MemberAvatar";

interface Props {
  post: PostSummary;
  pinned?: boolean;
  /** 작성자 소셜 프로필 사진 (없으면 이니셜) */
  avatarUrl?: string | null;
  /** 작성자 회원 등급 (아바타 배지) */
  grade?: MemberGrade;
}

/** 본문의 첫 사진 줄(PostContent 가 <img> 로 그리는 형태). 영상 파일 줄은 건너뛴다 */
const IMG_LINE_RE =
  /^(https?:\/\/[^\s<>"']+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>"']*)?|\/api\/community\/image\?p=[^\s<>"']+|\/[A-Za-z0-9_\-/.]+\.(?:png|jpe?g|webp|gif))$/i;
const VIDEO_LINE_RE = /^\/api\/community\/image\?p=[^\s<>"']+\.(?:mp4|mov|webm)$/i;

function firstImage(content: string): string | null {
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (IMG_LINE_RE.test(t) && !VIDEO_LINE_RE.test(t)) return t;
  }
  return null;
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

export default function FeedCard({ post, pinned = false, avatarUrl, grade }: Props) {
  const isNotice = pinned || post.is_notice;
  const href = post.board ? `/community/${post.board.slug}/${post.id}` : "/community";
  const preview = post.content ? toPreviewText(post.content, 140) : "";
  const thumb = post.content ? firstImage(post.content) : null;

  return (
    <Link
      href={href}
      className="block rounded-card border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-hover"
    >
      <div className="flex gap-3.5">
        {/* 아바타 + 레벨 배지 (Skool 방식: 우하단 겹침) */}
        <MemberAvatar name={post.author_name} avatarUrl={avatarUrl} grade={grade} />

        <div className="min-w-0 flex-1">
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {/* 작성자 · 시각 */}
              <div className="flex min-w-0 items-center gap-x-2">
                {isNotice && (
                  <span className="inline-flex shrink-0 items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro font-semibold text-fg">
                    공지
                  </span>
                )}
                <span className="truncate text-body-sm font-semibold text-fg-1">{post.author_name}</span>
                <span aria-hidden="true" className="text-fg-4">·</span>
                <span className="shrink-0 text-caption text-fg-3">{timeAgo(post.created_at)}</span>
              </div>

              {/* 제목 */}
              <h3 className="mt-1.5 line-clamp-2 text-ui font-bold leading-snug text-fg md:text-body">
                {post.title}
              </h3>

              {/* 본문 미리보기 (사진·영상 주소와 표시 기호를 뺀 글자만) */}
              {preview && (
                <p className="mt-1 line-clamp-2 text-body-sm text-fg-3">{preview}</p>
              )}
            </div>

            {/* 본문 첫 사진 */}
            {thumb && (
              // 본문 이미지와 같은 주소를 그대로 쓴다(외부·저장소 주소가 섞여 next/image 대신 img)
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="size-18 shrink-0 rounded-lg border border-line bg-surface-2 object-cover"
              />
            )}
          </div>

          {/* 게시판 이름 · 반응 수 (0이어도 표시, 오른쪽 끝) */}
          <div className="mt-3 flex items-center gap-3 text-caption text-fg-3">
            {post.board && <span className="min-w-0 truncate">{post.board.name}</span>}
            <span className="ml-auto flex shrink-0 items-center gap-2.5 md:gap-3.5">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <HeartIcon />
                <span className="sr-only">좋아요</span>
                {post.like_count}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <CommentIcon />
                <span className="sr-only">댓글</span>
                {post.comment_count}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <EyeIcon />
                <span className="sr-only">조회</span>
                {post.view_count}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
