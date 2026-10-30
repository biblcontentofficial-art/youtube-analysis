/**
 * /community/[board]/[id] — 커뮤니티 글 상세
 *
 * - 본문은 사용자 생성 콘텐츠이므로 dangerouslySetInnerHTML 을 절대 쓰지 않는다.
 *   whitespace-pre-wrap 으로 렌더하고 URL 만 React 노드로 분해해 자동 링크한다.
 */

import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import {
  canManagePost,
  canModerateCommunity,
  canReadBoard,
  isPublicBoard,
  displayName,
  excerpt,
  timeAgo,
  type Viewer,
} from "@/lib/community";
import {
  getAttachments,
  getAvatarMap,
  getBoard,
  getComments,
  getGradeMap,
  getPost,
  hasLiked,
} from "@/lib/communityDb";
import AttachmentList from "./_components/AttachmentList";
import CommentSection from "./_components/CommentSection";
import LikeButton from "./_components/LikeButton";
import PostActions from "./_components/PostActions";
import ViewTracker from "./_components/ViewTracker";
import MemberAvatar from "../../_components/MemberAvatar";
import PostContent from "../../_components/PostContent";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/** 뒤로가기 · 목록으로 글자 링크 (DESIGN 6.32) */
const TEXT_LINK =
  "inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg";

type Params = Promise<{ board: string; id: string }>;

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

// ── 메타데이터 ─────────────────────────────────────────────────────
/**
 * 글이 없을 때 · 게시판이 어긋날 때 · 읽기 권한이 없을 때 모두 같은 값을 돌려준다.
 * 제목을 다르게 주면 그것만으로 글의 존재 여부가 새어 나가기 때문이다.
 */
const GENERIC_METADATA: Metadata = {
  title: "비블 커뮤니티",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { board: boardParam, id } = await params;
  const boardSlug = safeDecode(boardParam);

  const [post, board, user] = await Promise.all([
    getPost(id),
    getBoard(boardSlug),
    currentUser(),
  ]);

  if (!post || post.status !== "published") return GENERIC_METADATA;
  if (!board || post.board_id !== board.id) return GENERIC_METADATA;

  const viewer: Viewer | null = user
    ? { id: user.id, email: user.email, plan: user.plan }
    : null;
  if (!canReadBoard(board, viewer)) return GENERIC_METADATA;

  const description = excerpt(post.content, 160);

  // 공개 게시판(비블 bibl 칼럼)은 검색엔진 색인 대상(소유자 요청 2026-10-30). 대표 주소 + 기사형 OG
  if (isPublicBoard(board.slug)) {
    const path = `/community/${board.slug}/${post.id}`;
    return {
      title: `${post.title} | 비블 bibl 칼럼`,
      description,
      robots: { index: true, follow: true },
      alternates: { canonical: path },
      openGraph: {
        type: "article",
        title: post.title,
        description,
        url: path,
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        authors: ["비블 bibl"],
      },
    };
  }

  // 그 밖의 게시판은 회원 전용이라 색인하지 않는다(레이아웃의 noindex 를 명시적으로 유지)
  return {
    title: `${post.title} | 비블 커뮤니티`,
    description,
    robots: { index: false, follow: false },
  };
}

// ── 페이지 ─────────────────────────────────────────────────────────
export default async function CommunityPostPage({ params }: { params: Params }) {
  const { board: boardParam, id } = await params;
  const boardSlug = safeDecode(boardParam);

  const [post, board, user] = await Promise.all([
    getPost(id),
    getBoard(boardSlug),
    currentUser(),
  ]);

  if (!post || post.status !== "published") notFound();
  if (!board) notFound();
  if (post.board_id !== board.id) notFound();

  const viewer: Viewer | null = user
    ? { id: user.id, email: user.email, plan: user.plan }
    : null;

  // 읽기 권한 없음 → 로그인 안내 화면
  if (!canReadBoard(board, viewer)) {
    const next = `/community/${boardSlug}/${id}`;
    return (
      <div className="mx-auto max-w-md rounded-card border border-line bg-surface p-8 text-center">
        <h1 className="text-h4 font-bold text-fg">
          회원 전용 게시판입니다
        </h1>
        <p className="mt-3 text-body-sm text-fg-3">
          {board.name} 게시판의 글은 로그인 후 확인할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href={`/sign-in?next=${encodeURIComponent(next)}`}
            className={buttonClass()}
          >
            로그인하기
          </Link>
          <Link
            href="/community"
            className={buttonClass({ variant: "secondary" })}
          >
            커뮤니티 홈
          </Link>
        </div>
      </div>
    );
  }

  const [comments, attachments, liked] = await Promise.all([
    getComments(post.id),
    getAttachments(post.id),
    viewer ? hasLiked(post.id, viewer.id) : Promise.resolve(false),
  ]);

  // 작성자·운영진 본인 조회와 비회원(공개 칼럼) 조회는 조회수에서 제외한다(조회 API 가 로그인 필요).
  // 실제 증가는 ViewTracker(클라이언트)가 마운트 시 1회만 수행한다.
  const isModerator = canModerateCommunity(viewer);
  const isAuthor = !!viewer && !!post.author_id && post.author_id === viewer.id;

  const canManage = canManagePost(post, viewer);

  // 작성자·댓글 작성자의 프로필 사진과 등급 (아바타)
  const peopleIds = [post.author_id, ...comments.map((c) => c.author_id)];
  const [avatarMap, gradeMap] = await Promise.all([
    getAvatarMap(peopleIds),
    getGradeMap(peopleIds),
  ]);

  const listHref = `/community/${boardSlug}`;

  return (
    <div className="mx-auto max-w-[720px]">
      <ViewTracker postId={post.id} skip={isModerator || isAuthor || !viewer} />
      {/* 뒤로가기 (DESIGN 6.32, 댓글 아래 '목록으로'와 같은 주소) */}
      <div className="mb-4">
        <Link href={listHref} className={TEXT_LINK}>
          <span aria-hidden="true">←</span>
          {board.name}
        </Link>
      </div>

      {/* 헤더 */}
      <header className="border-b border-line pb-6">
        {post.is_notice && (
          <span className="mb-3 inline-flex items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro font-semibold text-fg">
            공지
          </span>
        )}
        <h1 className="text-title font-extrabold text-fg wrap-anywhere md:text-h3">
          {post.title}
        </h1>

        <div className="mt-5 flex items-center gap-3">
          <MemberAvatar
            name={post.author_name}
            avatarUrl={post.author_id ? avatarMap[post.author_id] : null}
            grade={post.author_id ? gradeMap[post.author_id] : undefined}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-semibold text-fg-1">{displayName(post.author_name)}</p>
            <p className="tnum mt-0.5 text-caption text-fg-3">
              {timeAgo(post.created_at)}
              <span aria-hidden="true"> · </span>
              조회 {post.view_count.toLocaleString()}
            </p>
          </div>

          {canManage && (
            <div className="shrink-0 self-start">
              <PostActions postId={post.id} boardSlug={boardSlug} />
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <PostContent content={post.content} />

      {/* 첨부파일 */}
      <AttachmentList attachments={attachments} />

      {/* 좋아요 */}
      <div className="flex justify-center border-t border-line py-8">
        <LikeButton
          postId={post.id}
          initialLiked={liked}
          initialCount={post.like_count}
          isLoggedIn={!!viewer}
        />
      </div>

      {/* 댓글 */}
      <CommentSection
        postId={post.id}
        postAuthorId={post.author_id}
        comments={comments}
        avatarMap={avatarMap}
        gradeMap={gradeMap}
        currentUserId={viewer?.id ?? null}
        canModerate={isModerator}
        isLoggedIn={!!viewer}
      />

      {/* 목록으로 (위 뒤로가기와 같은 주소) */}
      <div className="mt-8 border-t border-line pt-2">
        <Link href={listHref} className={TEXT_LINK}>
          <span aria-hidden="true">←</span>
          목록으로
        </Link>
      </div>
    </div>
  );
}
