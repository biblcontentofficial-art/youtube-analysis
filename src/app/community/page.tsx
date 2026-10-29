/**
 * /community — Skool형 통합 피드
 * 게시판 칩(모바일) + 피드 머리(현재 게시판·검색·최신/인기) + 공지 상단 고정 + 페이지네이션.
 * 레이아웃 게이트가 비로그인을 먼저 막지만, canReadBoard 필터로 이중 방어한다.
 */

import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/lib/auth";
import {
  getAvatarMap,
  getBoards,
  getGradeMap,
  getMonthlyAuthorRanking,
  getRecentBoardIds,
  listFeed,
  listPosts,
} from "@/lib/communityDb";
import { PAGE_SIZE, canReadBoard, type PostSummary } from "@/lib/community";
import { buttonClass, cx } from "@/components/ui/button";
import CategoryChips from "./_components/CategoryChips";
import ChallengeLeaderboard from "./_components/ChallengeLeaderboard";
import FeedCard from "./_components/FeedCard";
import FeedHeader from "./_components/FeedHeader";
import FeedSkeleton from "./_components/FeedSkeleton";

export const dynamic = "force-dynamic";

/** 월간 TOP 5 후보를 띄우는 게시판(매일 유튜브 챌린지, slug 는 네이버 카페 이관 때의 'free') */
const CHALLENGE_SLUG = "free";

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

type FeedParams = Awaited<Props["searchParams"]>;

/**
 * 스켈레톤은 피드에만 건다(loading.tsx 대신). 게시판·검색·정렬·페이지가 바뀌면 key 가 바뀌어
 * 새 목록을 받는 동안 스켈레톤을 다시 보여 준다.
 */
export default async function CommunityFeedPage({ searchParams }: Props) {
  const sp = await searchParams;
  const key = [sp.cat ?? "", sp.page ?? "", sp.q ?? "", sp.sort ?? ""].join("|");
  return (
    <Suspense key={key} fallback={<FeedSkeleton />}>
      <CommunityFeed sp={sp} />
    </Suspense>
  );
}

async function CommunityFeed({ sp }: { sp: FeedParams }) {

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

  // 매일 유튜브 챌린지: 이번 달(KST) 작성 순위 TOP 5 후보. 챌린지 게시판과 커뮤니티 첫 화면(전체글)에서, 1페이지 · 검색 없음일 때만
  // (전체글에도 띄움: 소유자 요청 2026-10-29)
  const challengeBoard = readable.find((b) => b.slug === CHALLENGE_SLUG) ?? null;
  const showChallengeTop =
    challengeBoard !== null && (!cat || activeBoard?.slug === CHALLENGE_SLUG) && page === 1 && !q;
  const kst = new Date(Date.now() + 9 * 3600000);
  const ym = kst.toISOString().slice(0, 7);
  const lastDay = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth() + 1, 0)).getUTCDate();

  const [{ posts, total }, noticeRows, recentBoardIds, ranking] = await Promise.all([
    listFeed(feedIds, { page, q, sort }),
    showPinned && noticeBoard
      ? listPosts(noticeBoard.id, { page: 1 }).then((r) => r.notices.slice(0, 2))
      : Promise.resolve([]),
    getRecentBoardIds(),
    showChallengeTop && challengeBoard ? getMonthlyAuthorRanking(challengeBoard.id, ym) : Promise.resolve([]),
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
  const authorIds = [...pinned, ...posts].map((p) => p.author_id).concat(ranking.slice(0, 5).map((r) => r.author_id));
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

  const pageBtn = cx(buttonClass({ variant: "secondary", size: "sm" }), "tnum");
  const pageBtnOff =
    "inline-flex h-9 items-center justify-center rounded-control border border-line-soft px-3.5 text-body-sm text-fg-4";

  return (
    <div className="space-y-4">
      {/* 게시판 칩 (모바일 전용 · 데스크톱은 좌측 메뉴) */}
      <div className="lg:hidden">
        <CategoryChips
          boards={readable.map(({ id, slug, name }) => ({ id, slug, name }))}
          activeCat={activeBoard?.slug}
          sort={sort}
          q={q}
          recentBoardIds={[...recentBoardIds]}
        />
      </div>

      {/* 피드 머리: 현재 게시판 + 글 수 + 설명 · 검색 · 최신/인기 */}
      <FeedHeader
        title={activeBoard?.name ?? "전체글"}
        total={total}
        description={activeBoard?.description}
        cat={cat}
        sort={sort}
        q={q}
        recentHref={hrefFor(1, "recent")}
        popularHref={hrefFor(1, "popular")}
      />

      {showChallengeTop && (
        <ChallengeLeaderboard
          ranking={ranking}
          month={kst.getUTCMonth() + 1}
          daysLeft={lastDay - kst.getUTCDate() + 1}
          endLabel={`${kst.getUTCMonth() + 1}.${lastDay}`}
          viewerId={user?.id ?? null}
          avatarMap={avatarMap}
          writeHref={`/community/write?board=${CHALLENGE_SLUG}`}
          boardHref={cat ? undefined : `/community?cat=${CHALLENGE_SLUG}`}
        />
      )}

      {/* 검색 상태 */}
      {q && (
        <div className="flex items-center justify-between gap-3 text-caption text-fg-3">
          <span>
            ‘<span className="text-accent">{q}</span>’ 검색 결과 <span className="tnum">{total}</span>건
          </span>
          <Link
            href={hrefFor(1, sort, false)}
            className="inline-flex h-11 items-center text-fg-3 transition-colors hover:text-fg"
          >
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
          <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8">
            {q ? (
              <>
                <div>
                  <p className="text-ui font-semibold text-fg">검색 결과가 없습니다</p>
                  <p className="mt-1 text-body-sm text-fg-3">다른 검색어로 찾아보세요.</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-ui font-semibold text-fg">
                  아직 글이 없습니다. 첫 글을 남겨보세요
                </p>
                <Link href={writeHref} className={buttonClass({ variant: "secondary" })}>
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
        <nav aria-label="페이지" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
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
              aria-current={p === page ? "page" : undefined}
              className="tnum inline-flex h-9 min-w-9 items-center justify-center rounded-control border border-line px-3 text-body-sm text-fg-3 transition-colors duration-150 hover:border-line-hover hover:text-fg pointer-coarse:h-11 pointer-coarse:min-w-11 aria-[current=page]:border-line-hover aria-[current=page]:bg-surface-3 aria-[current=page]:font-semibold aria-[current=page]:text-accent"
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
