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

export const dynamic = "force-dynamic";

type Params = Promise<{ board: string; id: string }>;

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

// ── 본문 자동 링크 (XSS 없이 React 노드로 조립) ────────────────────
const URL_RE = /https?:\/\/[^\s<>"']+/g;
const TRAIL_RE = /[.,!?;:)\]}>'"·]+$/;

function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = new RegExp(URL_RE.source, "g");
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    let url = m[0];
    const trimmed = url.replace(TRAIL_RE, "");
    if (trimmed !== url) {
      url = trimmed;
      re.lastIndex = m.index + url.length;
    }
    if (!url || !/^https?:\/\/\S/i.test(url)) continue;

    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <a
        key={`u${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-[#00E5A0] hover:text-[#66FFCC] underline underline-offset-2 break-all"
      >
        {url}
      </a>
    );
    last = m.index + url.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── 블록형 본문 렌더 ───────────────────────────────────────────────
// 한 줄이 이미지·유튜브 주소면 그대로 삽입하고, "## " 소제목, "> " 인용, "---" 구분선을 지원한다.
const IMG_LINE_RE =
  /^(https?:\/\/[^\s<>"']+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>"']*)?|\/api\/community\/image\?p=[^\s<>"']+|\/[A-Za-z0-9_\-/.]+\.(?:png|jpe?g|webp|gif))$/i;
const YT_LINE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})\S*$/i;

function renderContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buf: string[] = [];
  let key = 0;

  const flush = () => {
    const chunk = buf.join("\n").replace(/^\n+|\n+$/g, "");
    buf = [];
    if (!chunk) return;
    nodes.push(
      <p key={`p${key++}`} className="whitespace-pre-wrap">
        {linkify(chunk)}
      </p>
    );
  };

  for (const line of text.split("\n")) {
    const t = line.trim();
    const yt = t.match(YT_LINE_RE);

    if (IMG_LINE_RE.test(t)) {
      flush();
      nodes.push(
        // 본문 이미지는 형태를 정규식으로 검증한 주소만 그린다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`i${key++}`}
          src={t}
          alt=""
          loading="lazy"
          className="my-6 w-full rounded-2xl border border-neutral-800"
        />
      );
    } else if (yt) {
      flush();
      nodes.push(
        <div
          key={`v${key++}`}
          className="my-6 aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800"
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${yt[1]}`}
            title="YouTube video"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    } else if (t === "---") {
      flush();
      nodes.push(<hr key={`h${key++}`} className="my-8 border-neutral-800" />);
    } else if (t.startsWith("## ")) {
      flush();
      nodes.push(
        <h3 key={`t${key++}`} className="mb-3 mt-9 text-lg font-bold tracking-tight text-white lg:text-xl">
          {t.slice(3)}
        </h3>
      );
    } else if (t.startsWith("> ")) {
      flush();
      nodes.push(
        <blockquote
          key={`q${key++}`}
          className="my-5 border-l-2 border-neutral-600 py-1 pl-4 italic text-neutral-300"
        >
          {linkify(t.slice(2))}
        </blockquote>
      );
    } else {
      buf.push(line);
    }
  }
  flush();
  return nodes;
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

  return {
    title: `${post.title} | 비블 커뮤니티`,
    description: excerpt(post.content, 160),
    // 회원 전용 게시판은 로그인 상태에서 접근했더라도 색인 대상이 아니다
    ...(board.read_role === "member" ? { robots: { index: false, follow: false } } : {}),
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
      <div className="mx-auto max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        <h1 className="text-white font-bold tracking-tight text-lg">
          회원 전용 게시판입니다
        </h1>
        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
          {board.name} 게시판의 글은 로그인 후 확인할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={`/sign-in?next=${encodeURIComponent(next)}`}
            className="bg-white hover:bg-neutral-200 text-black font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            로그인하기
          </Link>
          <Link
            href="/community"
            className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
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

  // 작성자·운영진 본인 조회는 조회수에서 제외한다.
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

  return (
    <div>
      <ViewTracker postId={post.id} skip={isModerator || isAuthor} />
      {/* 뒤로가기 */}
      <div className="mb-6">
        <Link
          href={`/community/${boardSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {board.name}
        </Link>
      </div>

      {/* 헤더 */}
      <header className="pb-6 border-b border-white/[0.06]">
        {post.is_notice && (
          <span className="inline-block mb-3 text-[11px] font-bold tracking-tight text-[#00E5A0] border border-[#00E5A0]/30 rounded-md px-2 py-0.5">
            공지
          </span>
        )}
        <h1 className="text-white font-bold tracking-tight text-2xl md:text-3xl leading-snug break-words">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
          <MemberAvatar
            name={post.author_name}
            avatarUrl={post.author_id ? avatarMap[post.author_id] : null}
            grade={post.author_id ? gradeMap[post.author_id] : undefined}
            size={28}
          />
          <span className="text-neutral-400">{displayName(post.author_name)}</span>
          <span aria-hidden="true">·</span>
          <span>{timeAgo(post.created_at)}</span>
          <span aria-hidden="true">·</span>
          <span>조회 {post.view_count.toLocaleString()}</span>

          {canManage && (
            <span className="ml-auto">
              <PostActions postId={post.id} boardSlug={boardSlug} />
            </span>
          )}
        </div>
      </header>

      {/* 본문 */}
      <article className="py-8 text-neutral-200 text-[15px] md:text-base leading-[1.85] break-words">
        {renderContent(post.content)}
      </article>

      {/* 첨부파일 */}
      <AttachmentList attachments={attachments} />

      {/* 좋아요 */}
      <div className="py-8 flex justify-center border-t border-white/[0.06]">
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
        comments={comments}
        avatarMap={avatarMap}
        gradeMap={gradeMap}
        currentUserId={viewer?.id ?? null}
        canModerate={isModerator}
        isLoggedIn={!!viewer}
      />
    </div>
  );
}
