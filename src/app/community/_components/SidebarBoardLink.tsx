"use client";

/**
 * 커뮤니티 사이드바 게시판 링크 (클라이언트 잎).
 * 레이아웃은 서버 컴포넌트라 searchParams 를 받지 못하므로, 지금 보고 있는 게시판 판정은 여기서 한다.
 *   - /community            → 전체글보기 (sort=popular 이면 인기글)
 *   - /community?cat={slug} → 그 게시판
 *   - /community/{slug}/{id} (글 상세) → 그 게시판
 * 현재 항목은 aria-current="page" + bg-surface-2 font-semibold text-fg (DESIGN 6.26).
 *
 * current 를 넘기면 URL 대신 그 값으로 판정한다(로컬 고정 화면 /ux-preview/r10-community-sidebar 용).
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { RESERVED_BOARD_SLUGS } from "@/lib/community";

/** 사이드바 항목 (DESIGN 6.26) */
export const SIDEBAR_ITEM =
  "flex h-10 items-center justify-between gap-2 rounded-md px-3 text-body-sm text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg pointer-coarse:h-11 aria-[current=page]:bg-surface-2 aria-[current=page]:font-semibold aria-[current=page]:text-fg";

/** 지금 보고 있는 곳. cat 이 null 이면 전체(피드), undefined 면 피드 밖(랭킹·소개 등) */
export interface SidebarCurrent {
  cat: string | null | undefined;
  popular: boolean;
}

/**
 * 링크가 가리키는 곳.
 *  - { kind: "all" }      전체글보기
 *  - { kind: "popular" }  인기글
 *  - { kind: "board", slug }
 *  - { kind: "none" }     안내 페이지로 직행하는 메뉴(현재 표시 없음)
 */
export type SidebarTarget =
  | { kind: "all" }
  | { kind: "popular" }
  | { kind: "board"; slug: string }
  | { kind: "none" };

function useSidebarCurrent(override?: SidebarCurrent): SidebarCurrent {
  const pathname = usePathname() || "";
  const params = useSearchParams();
  if (override) return override;

  if (pathname === "/community") {
    const cat = (params.get("cat") ?? "").trim();
    return { cat: cat || null, popular: params.get("sort") === "popular" };
  }
  // 글 상세: /community/{board}/{id}
  const segs = pathname.split("/");
  if (segs[1] === "community" && segs.length >= 4) {
    const seg = segs[2] ?? "";
    if (seg && !RESERVED_BOARD_SLUGS.includes(seg)) {
      let slug = seg;
      try {
        slug = decodeURIComponent(seg);
      } catch {
        // 잘못된 인코딩은 원본 그대로
      }
      return { cat: slug, popular: false };
    }
  }
  return { cat: undefined, popular: false };
}

function isCurrent(target: SidebarTarget, cur: SidebarCurrent): boolean {
  switch (target.kind) {
    case "all":
      return cur.cat === null && !cur.popular;
    case "popular":
      return cur.cat === null && cur.popular;
    case "board":
      return cur.cat === target.slug;
    default:
      return false;
  }
}

export default function SidebarBoardLink({
  href,
  target,
  current,
  children,
}: {
  href: string;
  target: SidebarTarget;
  /** 고정 화면용 판정값(넘기지 않으면 URL 로 판정) */
  current?: SidebarCurrent;
  children: ReactNode;
}) {
  const cur = useSidebarCurrent(current);
  const active = isCurrent(target, cur);
  const ref = useRef<HTMLAnchorElement>(null);

  // 메뉴 카드는 sticky + 안쪽 스크롤이라 뒤쪽 게시판이 현재 항목이면 카드 아래에 숨는다.
  // 현재 항목이 카드 밖에 있을 때만 카드 안 스크롤을 맞춘다(페이지 세로 스크롤은 건드리지 않는다).
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    const box = el?.closest<HTMLElement>("[data-sidebar-scroll]");
    if (!el || !box || box.scrollHeight <= box.clientHeight) return;
    // 카드 중 지금 화면에 보이는 부분(카드 ∩ 창) 안에 항목이 들어오도록 맞춘다
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const top = Math.max(b.top, 0);
    const bottom = Math.min(b.bottom, window.innerHeight);
    if (r.top >= top && r.bottom <= bottom) return;
    const view = Math.max(bottom - top, r.height);
    box.scrollTop += r.top - top - (view - r.height) / 2;
  }, [active]);

  return (
    <Link ref={ref} href={href} aria-current={active ? "page" : undefined} className={SIDEBAR_ITEM}>
      {children}
    </Link>
  );
}

/**
 * 새 글 배지 (최근 3일). 소유자 요청(8/30, 카페 원본 스타일)이라 빨간 원형 모양·색을 그대로 둔다(DESIGN 3.4, 결정 E 기본 B).
 * 접근성 보정: 보이는 'N' 은 aria-hidden, 스크린 리더에는 '새 글'.
 */
export function NewBadge({ className = "ml-1.5" }: { className?: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`${className} inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-owner-red text-[8px] font-bold leading-none text-fg`}
      >
        N
      </span>
      <span className="sr-only">새 글</span>
    </>
  );
}
