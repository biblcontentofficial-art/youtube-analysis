/**
 * /community/[board] — 게시판 글 목록 (?page=2&q=검색어)
 * 공지 상단 고정 + 일반글 페이지네이션 + 제목·내용 검색.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getBoard, listPosts } from "@/lib/communityDb";
import { PAGE_SIZE, canReadBoard, canWriteBoard } from "@/lib/community";
import PostRow from "../_components/PostRow";
import SearchBox from "../_components/SearchBox";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ board: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ board: string }>;
}): Promise<Metadata> {
  const { board: slug } = await params;
  const board = await getBoard(slug);
  if (!board) return { title: "비블 커뮤니티" };
  return {
    title: `${board.name} | 비블 커뮤니티`,
    description: board.description ?? "유튜브·사업 하는 사람들의 커뮤니티",
  };
}

/** 페이지네이션에 노출할 페이지 번호 (현재 페이지 주변 최대 5개) */
function pageWindow(current: number, total: number): number[] {
  const size = 5;
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  const out: number[] = [];
  for (let p = start; p <= end; p += 1) out.push(p);
  return out;
}

export default async function BoardPage({ params, searchParams }: Props) {
  const { board: slug } = await params;
  const sp = await searchParams;

  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const q = (sp.q ?? "").trim();

  const board = await getBoard(slug);
  if (!board) notFound();

  const user = await currentUser();

  // 읽기 권한 없음 → 리다이렉트 대신 안내 화면
  if (!canReadBoard(board, user)) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-16 text-center">
        <p className="text-lg font-bold tracking-tight text-white">{board.name}</p>
        <p className="mt-2 text-sm text-neutral-400">
          로그인한 회원만 볼 수 있는 게시판입니다.
        </p>
        <Link
          href={`/sign-in?next=${encodeURIComponent(`/community/${board.slug}`)}`}
          className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-neutral-200"
        >
          로그인하고 보기
        </Link>
      </div>
    );
  }

  const { posts, notices, total } = await listPosts(board.id, { page, q });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showNotices = page === 1 && !q && notices.length > 0;
  const canWrite = canWriteBoard(board, user);

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    if (p > 1) qs.set("page", String(p));
    if (q) qs.set("q", q);
    const s = qs.toString();
    return `/community/${board.slug}${s ? `?${s}` : ""}`;
  };

  const pageBtn =
    "rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white hover:bg-neutral-700";
  const pageBtnOff =
    "rounded-xl border border-white/[0.06] px-3 py-2 text-xs text-neutral-600";

  return (
    <div>
      {/* 게시판 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white">{board.name}</h1>
          {board.description && (
            <p className="mt-1 text-sm text-neutral-400">{board.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SearchBox boardSlug={board.slug} initialQuery={q} />
          {canWrite && (
            <Link
              href={`/community/write?board=${board.slug}`}
              className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-neutral-200"
            >
              글쓰기
            </Link>
          )}
        </div>
      </div>

      {/* 검색 상태 / 전체 개수 */}
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>
          {q ? (
            <>
              <span className="text-[#00E5A0]">{q}</span> 검색 결과 {total}개
            </>
          ) : (
            <>전체 {total}개</>
          )}
        </span>
        {q && (
          <Link href={`/community/${board.slug}`} className="text-neutral-400 hover:text-white">
            검색 해제
          </Link>
        )}
      </div>

      {/* 목록 */}
      <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-4">
        {showNotices &&
          notices.map((n) => (
            <PostRow key={n.id} post={n} boardSlug={board.slug} notice />
          ))}

        {posts.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-bold text-white">
              {q ? "검색 결과가 없습니다" : "아직 글이 없습니다"}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              {q ? "다른 검색어로 찾아보세요." : "이 게시판의 첫 글을 남겨보세요."}
            </p>
            {!q && canWrite && (
              <Link
                href={`/community/write?board=${board.slug}`}
                className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-neutral-200"
              >
                첫 글 작성하기
              </Link>
            )}
          </div>
        ) : (
          posts.map((p) => <PostRow key={p.id} post={p} boardSlug={board.slug} />)
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={pageBtn}>
              이전
            </Link>
          ) : (
            <span className={pageBtnOff}>이전</span>
          )}

          {pageWindow(page, totalPages).map((p) => (
            <Link
              key={p}
              href={hrefFor(p)}
              className={
                p === page
                  ? "rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-bold text-[#00E5A0] tabular-nums"
                  : "rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-neutral-400 tabular-nums hover:bg-white/[0.05] hover:text-white"
              }
            >
              {p}
            </Link>
          ))}

          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} className={pageBtn}>
              다음
            </Link>
          ) : (
            <span className={pageBtnOff}>다음</span>
          )}
        </nav>
      )}
    </div>
  );
}
