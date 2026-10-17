"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/logo";
import NavUser, { useSessionUser } from "./NavUser";
import SearchUsageBadge from "./SearchUsageBadge";
import NavMenuSheet, { type NavSheetFooter, type NavSheetGroup } from "./NavMenuSheet";
import NavHeightObserver from "./NavHeightObserver";

/**
 * 전역 네비(DESIGN 6.2, 레이아웃 F). 루트 레이아웃의 정적 렌더를 지키려고 경로 분기·현재 위치·로그인 표시는
 * 모두 이 클라이언트 잎에서만 한다(루트 레이아웃 auth()·cookies() 금지).
 *
 * - 홈형·앱형 같은 순서(소유자 요청 2026-10-17): 유튜브 트렌드 서치 · 커뮤니티 & 무료자료 │ 팀비블 1:1 유튜브 컨설팅 · 유튜브 채널 대행 · 브랜드 인큐베이팅 · 요금제
 *   모두 흰 600(현재 위치는 accent). 오른쪽은 홈형 로그인·시작하기, 앱형 남은 횟수 배지 · 아바타
 * - 1280 미만: 56px 한 줄(로고 · 시작하기 또는 아바타 · 메뉴 버튼) + 전체 높이 메뉴 시트
 */

export type NavItem = {
  href: string;
  label: string;
  /** 긴 페이지는 미리 받지 않는다 */
  prefetch?: false;
  /** 이 경로에서 현재 위치로 표시할지 */
  match: (pathname: string) => boolean;
};

/** base 그 자체이거나 그 아래 경로 */
const under = (p: string, base: string) => p === base || p.startsWith(`${base}/`);

/** 앱형 네비를 쓰는 경로(DESIGN 6.2 표) */
const APP_TOOL_ROUTES = ["/search", "/channels", "/my-channel", "/saved", "/trend-search", "/threads"];
const isAppRoute = (p: string) => APP_TOOL_ROUTES.some((b) => under(p, b)) || under(p, "/mypage");

/** 로그인·가입 화면: 오른쪽 로그인·시작하기를 숨긴다 */
const isAuthRoute = (p: string) => ["/sign-in", "/sign-up", "/sso-callback"].some((b) => under(p, b));

const WITH_BIBL: NavItem[] = [
  {
    href: "/studio/class/consulting",
    label: "팀비블 1:1 유튜브 컨설팅",
    prefetch: false,
    match: (p) => under(p, "/studio/class/consulting"),
  },
  // 대행 링크는 결정 1 답 전까지 지금 값(/studio) 유지
  { href: "/studio", label: "유튜브 채널 대행", match: (p) => p === "/studio" || under(p, "/studio/consulting") },
  { href: "/incubating", label: "브랜드 인큐베이팅", match: (p) => under(p, "/incubating") },
];

const DIY: NavItem[] = [
  { href: "/trend-search", label: "유튜브 트렌드 서치", match: (p) => APP_TOOL_ROUTES.some((b) => under(p, b)) },
  { href: "/community", label: "커뮤니티 & 무료자료", match: (p) => under(p, "/community") },
  { href: "/pricing", label: "요금제", match: (p) => p === "/pricing" },
];

/** 네비 링크(평소 fg-3 500, 현재 위치 accent 600). 전역 네비에는 밑줄이 없다 */
const NAV_LINK =
  "inline-flex h-9 items-center whitespace-nowrap rounded-control px-3 text-body-sm font-medium text-fg-3 transition-colors duration-150 hover:text-fg aria-[current=page]:font-semibold aria-[current=page]:text-accent";
/** 홈형 '비블과 함께'(사람 서비스) 강조: 흰 600 (지금 에메랄드 글자 대신) */
const NAV_LINK_STRONG =
  "inline-flex h-9 items-center whitespace-nowrap rounded-control px-3 text-body-sm font-semibold text-fg transition-colors duration-150 hover:text-fg-2 aria-[current=page]:text-accent";

const SHEET_ID = "site-menu-sheet";

function NavList({ label, items, pathname, strong }: { label: string; items: NavItem[]; pathname: string; strong?: boolean }) {
  return (
    <ul className="flex items-center" aria-label={label}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            prefetch={item.prefetch}
            aria-current={item.match(pathname) ? "page" : undefined}
            className={strong ? NAV_LINK_STRONG : NAV_LINK}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function SiteNav() {
  const pathname = usePathname() ?? "/";
  const kind: "home" | "app" = isAppRoute(pathname) ? "app" : "home";
  const authPage = isAuthRoute(pathname);
  const { user, loaded } = useSessionUser();

  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeSheet = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  // 경로가 바뀌면 시트를 닫는다
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const groups: NavSheetGroup[] = [
    { title: "직접 하기", items: DIY },
    { title: "비블과 함께", items: WITH_BIBL },
  ];

  const sheetFooter: NavSheetFooter =
    kind === "app" || authPage || !loaded ? "none" : user ? "home-member" : "home-guest";

  // '본문으로 건너뛰기': 해시 이동만으로는 포커스가 옮겨지지 않는 브라우저가 있어 직접 옮긴다
  const skipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("content");
    if (!target) return;
    e.preventDefault();
    target.focus();
    target.scrollIntoView();
  };

  return (
    <>
      <a
        href="#content"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-body-sm focus:font-semibold focus:text-accent-ink"
      >
        본문으로 건너뛰기
      </a>
      <header id="site-header" className="sticky top-0 z-50 border-b border-line bg-canvas">
        <div className="mx-auto flex h-14 max-w-wide items-center gap-6 px-6 lg:px-8 nav:h-16">
          <Link href="/" aria-label="bibl lab 홈" className="inline-flex h-11 shrink-0 items-center rounded-md">
            <Logo variant="header" />
          </Link>

          <nav aria-label="주 메뉴" className="hidden min-w-0 flex-1 items-center nav:flex">
            <NavList label="직접 하기" items={DIY.filter((i) => i.href !== "/pricing")} pathname={pathname} strong />
            <span aria-hidden="true" className="mx-3 h-4 w-px bg-line" />
            <NavList label="비블과 함께" items={[...WITH_BIBL, ...DIY.filter((i) => i.href === "/pricing")]} pathname={pathname} strong />
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {user && <SearchUsageBadge />}
            <NavUser user={user} loaded={loaded} hideAuthLinks={authPage} />
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={open ? "메뉴 닫기" : "전체 메뉴"}
              aria-expanded={open}
              aria-controls={SHEET_ID}
              onClick={() => setOpen((v) => !v)}
              className="-mr-2 flex size-11 items-center justify-center rounded-control text-fg transition-colors duration-150 hover:bg-surface-2 nav:hidden"
            >
              {open ? (
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <NavMenuSheet
          id={SHEET_ID}
          open={open}
          onClose={closeSheet}
          triggerRef={menuButtonRef}
          groups={groups}
          pathname={pathname}
          footer={sheetFooter}
          kakaoRow={kind === "app"}
        />
      </header>
      <NavHeightObserver targetId="site-header" />
    </>
  );
}
