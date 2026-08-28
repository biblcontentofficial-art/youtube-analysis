/**
 * Skool형 카테고리 필터 칩 (서버 컴포넌트)
 * "전체글" + 게시판 칩. 카테고리를 바꿔도 sort·q 는 유지한다.
 */

import Link from "next/link";
import type { Board } from "@/lib/community";

interface Props {
  boards: Board[];
  activeCat?: string;
  sort?: string;
  q?: string;
}

function hrefFor(cat: string | null, sort?: string, q?: string): string {
  const qs = new URLSearchParams();
  if (cat) qs.set("cat", cat);
  if (sort && sort !== "recent") qs.set("sort", sort);
  if (q) qs.set("q", q);
  const s = qs.toString();
  return `/community${s ? `?${s}` : ""}`;
}

const ACTIVE_CHIP =
  "shrink-0 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black";
const IDLE_CHIP =
  "shrink-0 whitespace-nowrap rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300 hover:border-neutral-600";

export default function CategoryChips({ boards, activeCat, sort, q }: Props) {
  return (
    <nav aria-label="카테고리" className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
      <Link href={hrefFor(null, sort, q)} className={activeCat ? IDLE_CHIP : ACTIVE_CHIP}>
        전체글
      </Link>
      {boards.map((b) => (
        <Link
          key={b.id}
          href={hrefFor(b.slug, sort, q)}
          className={activeCat === b.slug ? ACTIVE_CHIP : IDLE_CHIP}
        >
          {b.name}
        </Link>
      ))}
    </nav>
  );
}
