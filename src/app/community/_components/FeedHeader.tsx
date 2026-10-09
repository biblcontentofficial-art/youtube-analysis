/**
 * 피드 머리 (서버·클라이언트 공용, 훅 없음)
 * 왼쪽: 지금 보고 있는 게시판 이름(h2, 없으면 '전체글') + 글 수 + 게시판 설명 한 줄
 * 오른쪽: 검색창(서버 렌더 GET 폼, 자바스크립트 없이도 동작) + 최신·인기 세그먼트(aria-current)
 */

import Link from "next/link";
import { INPUT } from "@/components/ui/field";
import { SEGMENT, SEGMENT_ITEM } from "@/components/ui/chip";
import { buttonClass, cx } from "@/components/ui/button";

interface Props {
  /** 게시판 이름 (없으면 '전체글') */
  title: string;
  /** 글 수 (검색 중이면 검색 결과 수) */
  total: number;
  /** 게시판 설명 한 줄 */
  description?: string | null;
  cat?: string;
  sort: "recent" | "popular";
  q?: string;
  recentHref: string;
  popularHref: string;
}

export default function FeedHeader({
  title,
  total,
  description,
  cat,
  sort,
  q,
  recentHref,
  popularHref,
}: Props) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-h4 font-extrabold text-fg">{title}</h2>
          <span className="tnum text-caption text-fg-3">글 {total.toLocaleString("ko-KR")}개</span>
        </div>
        {description && <p className="mt-1 truncate text-body-sm text-fg-3">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-nowrap">
        <form action="/community" method="get" role="search" className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
          {cat && <input type="hidden" name="cat" value={cat} />}
          {sort === "popular" && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="community-search" className="sr-only">
            커뮤니티 검색
          </label>
          <input
            id="community-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="제목·내용 검색"
            className={cx(INPUT, "min-w-0 flex-1 lg:w-56 lg:flex-none")}
          />
          <button type="submit" className={buttonClass({ variant: "secondary" })}>
            검색
          </button>
        </form>

        <nav aria-label="정렬" className={SEGMENT}>
          <Link href={recentHref} aria-current={sort === "recent" ? "true" : undefined} className={SEGMENT_ITEM}>
            최신
          </Link>
          <Link href={popularHref} aria-current={sort === "popular" ? "true" : undefined} className={SEGMENT_ITEM}>
            인기
          </Link>
        </nav>
      </div>
    </div>
  );
}
