"use client";

/**
 * 게시판 칩 (모바일 · 데스크톱은 좌측 메뉴)
 * "전체글" + 게시판 칩. 카테고리를 바꿔도 sort·q 는 유지한다.
 * 현재 게시판은 aria-current="page" 로 표시하고(칩 레시피 DESIGN 6.6),
 * 칩 안 N 배지는 칩의 gap 만 쓴다(여백 없는 NewBadge).
 * 뒤쪽 칩을 눌러 화면이 바뀌어도 활성 칩이 칩 줄 가운데로 오게 가로 스크롤을 맞춘다.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BOARD_LINK_OVERRIDES, type Board } from "@/lib/community";
import { CHIP } from "@/components/ui/chip";
import { NewBadge } from "./SidebarBoardLink";

interface Props {
  boards: Pick<Board, "id" | "slug" | "name">[];
  activeCat?: string;
  sort?: string;
  q?: string;
  /** 최근 3일 내 새 글이 올라온 게시판 id (New 배지) */
  recentBoardIds?: string[];
}

function hrefFor(cat: string | null, sort?: string, q?: string): string {
  const qs = new URLSearchParams();
  if (cat) qs.set("cat", cat);
  if (sort && sort !== "recent") qs.set("sort", sort);
  if (q) qs.set("q", q);
  const s = qs.toString();
  return `/community${s ? `?${s}` : ""}`;
}

export default function CategoryChips({ boards, activeCat, sort, q, recentBoardIds }: Props) {
  const rowRef = useRef<HTMLElement>(null);
  const recent = new Set(recentBoardIds ?? []);

  // 활성 칩을 칩 줄 가운데로 (scrollIntoView({ inline: "center" }) 와 같은 결과를
  // 칩 줄 안에서만 계산해, 페이지 세로 스크롤은 건드리지 않는다)
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const chip = row.querySelector<HTMLElement>('[aria-current="page"]');
    if (!chip) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollLeft = Math.max(0, left);
  }, [activeCat]);

  return (
    <nav
      ref={rowRef}
      aria-label="게시판"
      className="scrollbar-hide relative -mx-6 flex items-center gap-1.5 overflow-x-auto px-6"
    >
      <Link
        href={hrefFor(null, sort, q)}
        aria-current={activeCat ? undefined : "page"}
        className={CHIP}
      >
        전체글
      </Link>
      {boards.map((b) => {
        const override = BOARD_LINK_OVERRIDES[b.slug];
        return (
          <Link
            key={b.id}
            href={override ?? hrefFor(b.slug, sort, q)}
            aria-current={!override && activeCat === b.slug ? "page" : undefined}
            className={CHIP}
          >
            {b.name}
            {!override && recent.has(b.id) && <NewBadge className="" />}
          </Link>
        );
      })}
    </nav>
  );
}
