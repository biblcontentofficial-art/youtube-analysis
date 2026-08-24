/**
 * /community — 커뮤니티 홈
 * ① 인기글  ② 게시판 카드 그리드(그룹별)  ③ 최신글
 * 목록에는 현재 사용자가 읽을 수 있는 게시판(canReadBoard)의 글만 노출한다.
 */

import Link from "next/link";
import { currentUser } from "@/lib/auth";
import {
  getBoards,
  getBoardCounts,
  listPopularPosts,
  listRecentPosts,
} from "@/lib/communityDb";
import { canReadBoard, groupBoards, type PostSummary } from "@/lib/community";
import PostRow from "./_components/PostRow";

export const dynamic = "force-dynamic";

export default async function CommunityHome() {
  const [user, recent, popular, boards, counts] = await Promise.all([
    currentUser(),
    listRecentPosts(12),
    listPopularPosts(5),
    getBoards(),
    getBoardCounts(),
  ]);

  const groups = groupBoards(boards);
  const writeHref = user
    ? "/community/write"
    : `/sign-in?next=${encodeURIComponent("/community/write")}`;

  // 읽기 권한이 없는 게시판의 글은 홈에서도 감춘다
  const readable = new Set(
    boards.filter((b) => canReadBoard(b, user)).map((b) => b.slug)
  );
  const visible = (p: PostSummary) => !!p.board?.slug && readable.has(p.board.slug);

  const popularPosts = popular.filter(visible);
  const recentPosts = recent.filter(visible);
  const isEmpty = recentPosts.length === 0 && popularPosts.length === 0;

  return (
    <div className="space-y-10">
      {/* ① 인기글 */}
      {popularPosts.length > 0 && (
        <section>
          <h2 className="text-base font-bold tracking-tight text-white">지금 인기 있는 글</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            {popularPosts.map((p, i) => (
              <Link
                key={p.id}
                href={`/community/${p.board?.slug}/${p.id}`}
                className="group flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 last:border-b-0 hover:bg-white/[0.02]"
              >
                <span className="w-4 shrink-0 text-sm font-bold text-[#00E5A0] tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-200 group-hover:text-white">
                  {p.title}
                </span>
                <span className="hidden shrink-0 text-xs text-neutral-500 sm:block">
                  {p.board?.name}
                </span>
                <span className="shrink-0 text-xs text-neutral-500 tabular-nums">
                  좋아요 {p.like_count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ② 게시판 */}
      {groups.length > 0 && (
        <section className="space-y-6">
          {groups.map((g) => (
            <div key={g.group}>
              <h2 className="text-base font-bold tracking-tight text-white">{g.group}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {g.boards.map((b) => (
                  <Link
                    key={b.id}
                    href={`/community/${b.slug}`}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                        {b.name}
                      </span>
                      {b.read_role === "member" && (
                        <span className="shrink-0 rounded-md border border-neutral-700 px-1.5 py-0.5 text-[11px] text-neutral-400">
                          회원 전용
                        </span>
                      )}
                      <span className="shrink-0 text-xs text-[#00E5A0] tabular-nums">
                        {counts[b.id] ?? 0}
                      </span>
                    </div>
                    {b.description && (
                      <p className="mt-1.5 line-clamp-1 text-xs text-neutral-500">
                        {b.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ③ 최신글 */}
      <section>
        <h2 className="text-base font-bold tracking-tight text-white">최신 글</h2>

        {isEmpty ? (
          <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-14 text-center">
            <p className="text-base font-bold tracking-tight text-white">
              아직 올라온 글이 없습니다
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              첫 글을 남기고 커뮤니티를 시작해 보세요.
            </p>
            <Link
              href={writeHref}
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-neutral-200"
            >
              첫 글 작성하기
            </Link>
          </div>
        ) : recentPosts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-10 text-center text-sm text-neutral-400">
            표시할 최신 글이 없습니다.
          </p>
        ) : (
          <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-4">
            {recentPosts.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                boardSlug={p.board?.slug as string}
                boardName={p.board?.name ?? null}
                notice={p.is_notice}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
