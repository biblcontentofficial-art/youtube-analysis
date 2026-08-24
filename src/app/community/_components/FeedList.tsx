/**
 * 통합 피드 목록 (전체글보기 · 인기글 공용)
 * 네이버 카페 "전체글보기"처럼 게시판 배지 + 제목 + 작성자·시간·조회수를 한 줄에 촘촘히 담는다.
 * 순수 표시용 서버 컴포넌트 — 권한 필터는 호출부(page)에서 이미 끝난 상태로 posts를 받는다.
 */

import Link from "next/link";
import { PAGE_SIZE, timeAgo, displayName, type PostSummary } from "@/lib/community";

interface Props {
  posts: PostSummary[];
  total: number;
  page: number;
  /** 페이지네이션 링크 기준 경로 (예: "/community/all") */
  basePath: string;
  q?: string;
}

/** 현재 페이지 주변 최대 5개의 페이지 번호 */
function pageWindow(current: number, total: number): number[] {
  const size = 5;
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  const out: number[] = [];
  for (let p = start; p <= end; p += 1) out.push(p);
  return out;
}

export default function FeedList({ posts, total, page, basePath, q = "" }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    if (p > 1) qs.set("page", String(p));
    if (q) qs.set("q", q);
    const s = qs.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };

  const pageBtn =
    "rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white hover:bg-neutral-700";
  const pageBtnOff =
    "rounded-xl border border-white/[0.06] px-3 py-2 text-xs text-neutral-600";

  return (
    <div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4">
        {posts.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-bold text-white">글이 없습니다</p>
            <p className="mt-2 text-xs text-neutral-500">
              {q ? "다른 검색어로 찾아보세요." : "새 글이 올라오면 여기에 모입니다."}
            </p>
          </div>
        ) : (
          <ul>
            {posts.map((post) => {
              const slug = post.board?.slug ?? null;
              const boardName = post.board?.name ?? null;

              return (
                <li
                  key={post.id}
                  className="group relative flex items-center gap-2.5 border-b border-white/[0.06] px-1 py-2.5 last:border-b-0 hover:bg-white/[0.02] sm:gap-3"
                >
                  {/* 게시판 배지 — 행 전체 링크 위에 겹쳐 두어 게시판으로 따로 이동한다 */}
                  {boardName && slug && (
                    <Link
                      href={`/community/${slug}`}
                      className="relative z-[1] hidden w-24 shrink-0 truncate rounded border border-neutral-800 px-1.5 text-[11px] text-neutral-500 hover:border-neutral-700 hover:text-neutral-300 sm:block"
                    >
                      {boardName}
                    </Link>
                  )}

                  {post.is_notice && (
                    <span className="shrink-0 rounded border border-neutral-700 px-1.5 text-[11px] font-bold text-[#00E5A0]">
                      공지
                    </span>
                  )}

                  {/* 제목 — ::before 로 행 전체를 클릭 영역으로 넓힌다 */}
                  {slug ? (
                    <Link
                      href={`/community/${slug}/${post.id}`}
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-neutral-200 before:absolute before:inset-0 before:content-[''] group-hover:text-white sm:text-sm"
                    >
                      <span className="min-w-0 truncate">{post.title}</span>
                      {post.comment_count > 0 && (
                        <span className="shrink-0 text-[11px] font-bold text-[#00E5A0] tabular-nums">
                          [{post.comment_count}]
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-200 sm:text-sm">
                      {post.title}
                    </span>
                  )}

                  <span className="hidden w-20 shrink-0 truncate text-right text-[11px] text-neutral-500 sm:block">
                    {displayName(post.author_name)}
                  </span>

                  <span className="w-14 shrink-0 text-right text-[11px] text-neutral-500">
                    {timeAgo(post.created_at)}
                  </span>

                  <span className="hidden w-16 shrink-0 text-right text-[11px] text-neutral-500 tabular-nums sm:block">
                    조회 {post.view_count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
              aria-current={p === page ? "page" : undefined}
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
