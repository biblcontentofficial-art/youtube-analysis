/**
 * /community — Skool형 통합 피드
 * 카테고리 칩 필터 + 정렬(최신/인기) 토글 + 검색 + 공지 상단 고정 + 페이지네이션.
 * 레이아웃 게이트가 비로그인을 먼저 막지만, canReadBoard 필터로 이중 방어한다.
 */

import Link from "next/link";
import { currentUser } from "@/lib/auth";
import {
  getAvatarMap,
  getBoards,
  getGradeMap,
  getRecentBoardIds,
  listFeed,
  listPosts,
} from "@/lib/communityDb";
import { PAGE_SIZE, canReadBoard, type PostSummary } from "@/lib/community";
import CategoryChips from "./_components/CategoryChips";
import FeedCard from "./_components/FeedCard";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ cat?: string; page?: string; q?: string; sort?: string }>;
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

export default async function CommunityFeedPage({ searchParams }: Props) {
  const sp = await searchParams;

  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const q = (sp.q ?? "").trim();
  const sort: "recent" | "popular" = sp.sort === "popular" ? "popular" : "recent";
  const cat = (sp.cat ?? "").trim();

  const [user, boards] = await Promise.all([currentUser(), getBoards()]);

  // 이중 방어: 읽기 권한이 있는 게시판 id만 조회 대상에 넣는다
  const readable = boards.filter((b) => canReadBoard(b, user));
  const activeBoard = cat ? readable.find((b) => b.slug === cat) ?? null : null;
  const feedIds = cat
    ? activeBoard
      ? [activeBoard.id]
      : []
    : readable.map((b) => b.id);

  // 공지 상단 고정: 통합 피드 · 1페이지 · 검색 없음 · 최신순일 때만
  const noticeBoard = readable.find((b) => b.slug === "notice") ?? null;
  const showPinned = !cat && page === 1 && !q && sort === "recent" && noticeBoard !== null;

  const [{ posts, total }, noticeRows, recentBoardIds] = await Promise.all([
    listFeed(feedIds, { page, q, sort }),
    showPinned && noticeBoard
      ? listPosts(noticeBoard.id, { page: 1 }).then((r) => r.notices.slice(0, 2))
      : Promise.resolve([]),
    getRecentBoardIds(),
  ]);

  const pinned: PostSummary[] =
    noticeBoard === null
      ? []
      : noticeRows.map((n) => ({
          ...n,
          board: { slug: noticeBoard.slug, name: noticeBoard.name },
        }));

  // 상단 고정과 겹치는 공지는 본문 피드에서 뺀다 (같은 카드 중복 방지)
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const feedPosts = posts.filter((p) => !pinnedIds.has(p.id));

  // 작성자 프로필 사진 · 등급 (아바타 배지)
  const authorIds = [...pinned, ...posts].map((p) => p.author_id);
  const [avatarMap, gradeMap] = await Promise.all([
    getAvatarMap(authorIds),
    getGradeMap(authorIds),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** cat·q·sort 를 보존한 피드 링크 */
  const hrefFor = (p: number, s: "recent" | "popular" = sort, keepQ = true) => {
    const qs = new URLSearchParams();
    if (cat) qs.set("cat", cat);
    if (p > 1) qs.set("page", String(p));
    if (keepQ && q) qs.set("q", q);
    if (s === "popular") qs.set("sort", s);
    const str = qs.toString();
    return `/community${str ? `?${str}` : ""}`;
  };

  const writeHref = `/community/write${activeBoard ? `?board=${activeBoard.slug}` : ""}`;

  const pageBtn =
    "rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white hover:bg-neutral-700";
  const pageBtnOff =
    "rounded-xl border border-white/[0.06] px-3 py-2 text-xs text-neutral-600";

  return (
    <div className="space-y-4">
      {/* 카테고리 칩(모바일 전용 · 데스크톱은 좌측 메뉴) + 정렬 토글 */}
      <div className="flex items-center gap-4 lg:justify-end">
        <div className="min-w-0 flex-1 lg:hidden">
          <CategoryChips
            boards={readable}
            activeCat={activeBoard?.slug}
            sort={sort}
            q={q}
            recentBoardIds={recentBoardIds}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          <Link
            href={hrefFor(1, "recent")}
            className={
              sort === "recent" ? "font-semibold text-white" : "text-neutral-500 hover:text-neutral-300"
            }
          >
            최신
          </Link>
          <Link
            href={hrefFor(1, "popular")}
            className={
              sort === "popular" ? "font-semibold text-white" : "text-neutral-500 hover:text-neutral-300"
            }
          >
            인기
          </Link>
        </div>
      </div>

      {/* 검색 — 서버 렌더 GET 폼 (자바스크립트 없이도 동작) */}
      <form action="/community" method="get" className="flex items-center gap-2">
        {cat && <input type="hidden" name="cat" value={cat} />}
        {sort === "popular" && <input type="hidden" name="sort" value={sort} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="제목·내용 검색"
          aria-label="커뮤니티 검색"
          className="w-44 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none sm:w-56"
        />
        <button
          type="submit"
          className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          검색
        </button>
      </form>

      {/* 검색 상태 */}
      {q && (
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span>
            ‘<span className="text-[#00E5A0]">{q}</span>’ 검색 결과 {total}건
          </span>
          <Link href={hrefFor(1, sort, false)} className="text-neutral-400 hover:text-white">
            검색 해제
          </Link>
        </div>
      )}

      {/* 피드 */}
      <div className="space-y-3">
        {pinned.map((n) => (
          <FeedCard
            key={`pin-${n.id}`}
            post={n}
            avatarUrl={n.author_id ? avatarMap[n.author_id] : null}
            grade={n.author_id ? gradeMap[n.author_id] : undefined}
            pinned
          />
        ))}

        {feedPosts.length === 0 && pinned.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-16 text-center">
            {q ? (
              <>
                <p className="text-sm font-bold text-white">검색 결과가 없습니다</p>
                <p className="mt-2 text-xs text-neutral-500">다른 검색어로 찾아보세요.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-white">
                  아직 글이 없습니다. 첫 글을 남겨보세요
                </p>
                <Link
                  href={writeHref}
                  className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-neutral-200"
                >
                  새 포스트
                </Link>
              </>
            )}
          </div>
        ) : (
          feedPosts.map((p) => (
            <FeedCard
              key={p.id}
              post={p}
              avatarUrl={p.author_id ? avatarMap[p.author_id] : null}
              grade={p.author_id ? gradeMap[p.author_id] : undefined}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
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
