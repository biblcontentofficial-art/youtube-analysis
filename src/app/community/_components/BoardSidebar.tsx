"use client";

/**
 * 커뮤니티 게시판 사이드바
 * - desktop: 좌측 고정 컬럼 (그룹별 목록)
 * - mobile:  상단 가로 스크롤 칩
 * 현재 경로(usePathname)로 활성 게시판을 표시한다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Board } from "@/lib/community";

export interface BoardGroup {
  group: string;
  boards: Board[];
}

/** /community/[board]/... 에서 현재 게시판 slug 추출 (write·admin 은 게시판 아님) */
function currentSlug(pathname: string): string | null {
  const m = pathname.match(/^\/community\/([^/?#]+)/);
  if (!m) return null;
  const seg = m[1];
  if (seg === "write" || seg === "admin") return null;
  return seg;
}

export default function BoardSidebar({
  groups,
  variant,
}: {
  groups: BoardGroup[];
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname() ?? "";
  const active = currentSlug(pathname);

  if (groups.length === 0) return null;

  // ── 모바일: 가로 스크롤 칩 ──────────────────────────────────
  if (variant === "mobile") {
    const flat = groups.flatMap((g) => g.boards);
    return (
      <nav className="-mx-4 mt-6 overflow-x-auto px-4 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 whitespace-nowrap pb-1">
          <Link
            href="/community"
            className={
              pathname === "/community"
                ? "rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-bold text-white"
                : "rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-white"
            }
          >
            홈
          </Link>
          {flat.map((b) => {
            const on = b.slug === active;
            return (
              <Link
                key={b.id}
                href={`/community/${b.slug}`}
                className={
                  on
                    ? "rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-bold text-[#00E5A0]"
                    : "rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                }
              >
                {b.name}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // ── 데스크톱: 좌측 고정 사이드바 ────────────────────────────
  return (
    <aside className="hidden w-52 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-6">
        <Link
          href="/community"
          className={
            pathname === "/community"
              ? "block rounded-lg bg-white/[0.05] px-3 py-2 text-sm font-bold text-white"
              : "block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/[0.02] hover:text-white"
          }
        >
          커뮤니티 홈
        </Link>

        {groups.map((g) => (
          <div key={g.group}>
            <p className="px-3 text-[11px] font-bold tracking-wider text-neutral-500">
              {g.group}
            </p>
            <ul className="mt-2 space-y-0.5">
              {g.boards.map((b) => {
                const on = b.slug === active;
                return (
                  <li key={b.id}>
                    <Link
                      href={`/community/${b.slug}`}
                      className={
                        on
                          ? "block rounded-lg bg-white/[0.05] px-3 py-2 text-sm font-bold text-[#00E5A0]"
                          : "block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/[0.02] hover:text-white"
                      }
                    >
                      {b.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
