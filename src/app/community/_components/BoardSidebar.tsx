"use client";

/**
 * 커뮤니티 좌측 사이드바 (네이버 카페형 구성)
 * ① 프로필 카드 ② 액션 버튼 ③ 검색 ④ 전체글/인기글 ⑤ 그룹별 게시판 메뉴
 *
 * 데스크톱: w-60 고정폭 + sticky.
 * 모바일:   본문 위에 접혀서 노출되고, 펼치면 게시판 27개가 그룹째로 모두 보인다.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { groupBoards, type Board } from "@/lib/community";

const OPEN_CHAT_URL = "https://open.kakao.com/o/gsMC55Jh";

/** /community/[board]/... 에서 현재 게시판 slug 추출 (정적 세그먼트는 게시판이 아니다) */
function currentSlug(pathname: string): string | null {
  const m = pathname.match(/^\/community\/([^/?#]+)/);
  if (!m) return null;
  const seg = m[1];
  if (seg === "write" || seg === "admin" || seg === "all" || seg === "popular") return null;
  return seg;
}

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

/** 회원 전용 게시판 표시용 자물쇠 */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="ml-1 inline-block h-3.5 w-3.5 shrink-0 align-[-1px] text-neutral-600"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function BoardSidebar({
  boards,
  stats,
  isLoggedIn,
}: {
  boards: Board[];
  stats: { posts: number; members: number };
  isLoggedIn: boolean;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const active = currentSlug(pathname);
  const groups = groupBoards(boards);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    router.push(`/community/all?q=${encodeURIComponent(q)}`);
  }

  const feedLinks = [
    { href: "/community/all", label: "전체글보기", count: stats.posts },
    { href: "/community/popular", label: "인기글", count: null as number | null },
  ];

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-60 lg:self-start">
      {/* ① 프로필 카드 */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <Link
          href="/community"
          className="block text-[15px] font-bold tracking-tight text-white hover:text-[#66FFCC]"
        >
          비블 커뮤니티
        </Link>
        <p className="mt-1 text-[12px] leading-snug text-neutral-400">
          비블랩 회원들의 유튜브·사업 공간
        </p>

        <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 text-[12px] text-neutral-400">
          <span>
            멤버 <span className="font-semibold text-white">{fmt(stats.members)}</span>명
          </span>
          <span className="text-neutral-700">·</span>
          <span>
            글 <span className="font-semibold text-white">{fmt(stats.posts)}</span>개
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500">운영 비블 bibl</p>

        {/* ② 버튼 */}
        <div className="mt-3.5 space-y-2">
          {isLoggedIn ? (
            <Link
              href="/community/write"
              className="block rounded-xl bg-white px-3 py-2.5 text-center text-[13px] font-bold text-black hover:bg-neutral-200"
            >
              글쓰기
            </Link>
          ) : (
            <Link
              href={`/sign-in?next=${encodeURIComponent("/community")}`}
              className="block rounded-xl bg-white px-3 py-2.5 text-center text-[13px] font-bold text-black hover:bg-neutral-200"
            >
              가입하고 시작하기
            </Link>
          )}
          <a
            href={OPEN_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="참여코드 230000"
            className="block rounded-xl border border-neutral-700 px-3 py-2.5 text-center text-[13px] text-neutral-300 hover:bg-white/[0.04] hover:text-white"
          >
            비블 오픈채팅방
          </a>
        </div>
      </div>

      {/* ③ 검색 */}
      <form onSubmit={submitSearch} className="mt-3 flex items-center gap-1.5">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="커뮤니티 검색"
          aria-label="커뮤니티 검색"
          className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-[13px] text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="검색"
          className="shrink-0 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-neutral-400 hover:bg-white/[0.04] hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </button>
      </form>

      {/* ④ 전체글보기 · 인기글 */}
      <nav className="mt-3 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
        {feedLinks.map((f, i) => {
          const on = pathname === f.href;
          return (
            <Link
              key={f.href}
              href={f.href}
              className={[
                "flex items-center justify-between px-3 py-2.5 text-[13px]",
                i > 0 ? "border-t border-white/[0.06]" : "",
                on
                  ? "bg-white/[0.04] font-semibold text-white"
                  : "text-neutral-300 hover:bg-white/[0.02] hover:text-white",
              ].join(" ")}
            >
              <span>{f.label}</span>
              {f.count !== null && (
                <span className="text-[12px] tabular-nums text-neutral-500">{fmt(f.count)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 모바일 전용 토글 */}
      {groups.length > 0 && (
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-[13px] text-neutral-300 hover:text-white lg:hidden"
        >
          <span>
            게시판 전체 <span className="text-neutral-500">({boards.length})</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`h-4 w-4 text-neutral-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}

      {/* ⑤ 그룹별 게시판 메뉴 */}
      {groups.length > 0 && (
        <nav className={`${menuOpen ? "block" : "hidden"} mt-3 space-y-5 lg:block`}>
          {groups.map((g) => (
            <div key={g.group}>
              <p className="px-2 text-[11px] font-bold tracking-wide text-neutral-500">
                {g.group}
              </p>
              <ul className="mt-1.5">
                {g.boards.map((b) => {
                  const on = b.slug === active;
                  return (
                    <li key={b.id}>
                      <Link
                        href={`/community/${b.slug}`}
                        aria-current={on ? "page" : undefined}
                        className={[
                          "relative block rounded-md py-1.5 pl-3 pr-2 text-[13px] leading-snug",
                          on
                            ? "bg-white/[0.04] font-semibold text-white"
                            : "text-neutral-400 hover:bg-white/[0.02] hover:text-white",
                        ].join(" ")}
                      >
                        {on && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-full bg-[#00E5A0]"
                          />
                        )}
                        {b.name}
                        {b.read_role === "member" && <LockIcon />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </aside>
  );
}
