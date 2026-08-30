"use client";

/**
 * 커뮤니티 상단 탭 네비게이션 (Skool형)
 * 커뮤니티 / 랭킹 / 소개 + (운영진) 관리.
 * "커뮤니티" 탭은 피드뿐 아니라 /community/[board]·글 상세·write 경로에서도 활성으로 취급한다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
}

/** 커뮤니티 탭이 아닌 별도 탭의 경로 접두사 */
const OTHER_TAB_PREFIXES = [
  "/community/incubating",
  "/community/ranking",
  "/community/about",
  "/community/admin",
];

function isActiveTab(pathname: string, href: string): boolean {
  if (href === "/community") {
    // /community 하위 전부(게시판·글 상세·write 포함)를 커뮤니티 탭 활성으로 취급하되,
    // 랭킹·소개·관리는 자기 탭으로 넘긴다.
    if (!pathname.startsWith("/community")) return false;
    return !OTHER_TAB_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CommunityTabs({ isModerator }: { isModerator: boolean }) {
  const pathname = usePathname() || "/community";

  const tabs: Tab[] = [
    { href: "/community", label: "커뮤니티" },
    { href: "/incubating", label: "브랜드 인큐베이팅" },
    { href: "/community/ranking", label: "랭킹" },
    { href: "/community/about", label: "소개" },
    ...(isModerator ? [{ href: "/community/admin", label: "관리" }] : []),
  ];

  return (
    <nav className="border-b border-white/[0.06]">
      <div className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${
                active
                  ? "border-[#00E5A0] font-semibold text-white"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
