"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/ui/icons";

const PAGES = [
  { label: "홈", href: "/" },
  { label: "영상 찾기", href: "/search" },
  { label: "채널 찾기", href: "/channels" },
  { label: "수집한 영상", href: "/saved" },
  { label: "요금제", href: "/pricing" },
  { label: "채널 대행", href: "/studio" },
  { label: "무료 상담", href: "/studio/consulting" },
  { label: "마이페이지", href: "/mypage" },
  { label: "로그인", href: "/sign-in" },
  { label: "회원가입", href: "/sign-up" },
];

/**
 * 개발 모드 전용 이동 메뉴(layout.tsx 가 development 에서만 불러와 운영 번들에 없음).
 * 모양은 DESIGN 토큰으로(블러·그림자·노란 면 없음). 카카오 상담 버튼(오른쪽 아래)을 가리지 않게 왼쪽 아래에 둔다.
 */
export default function DevToolbar() {
  const [open, setOpen] = useState(false);
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {open && (
        <nav aria-label="개발 모드 이동" className="mb-2 w-52 overflow-hidden rounded-card border border-line-strong bg-surface-2">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span lang="en" className="text-micro font-bold tracking-wide text-fg-2">DEV NAV</span>
            <span lang="en" className="text-micro text-fg-3">localhost</span>
          </div>
          {/* 페이지 목록 */}
          <ul className="py-1">
            {PAGES.map((p) => (
              <li key={p.href}>
                <a
                  href={p.href}
                  aria-current={path === p.href ? "page" : undefined}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 text-caption text-fg-2 transition-colors duration-150 hover:bg-surface-3 hover:text-fg aria-[current=page]:font-semibold aria-[current=page]:text-accent"
                >
                  <span>{p.label}</span>
                  <span className="text-micro text-fg-3">{p.href}</span>
                </a>
              </li>
            ))}
          </ul>
          {/* 현재 경로 */}
          <p className="truncate border-t border-line px-3 py-2 text-micro text-fg-3">{path}</p>
        </nav>
      )}

      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="개발 모드 네비게이션"
        className="inline-flex h-9 select-none items-center gap-1.5 rounded-control border border-line-strong bg-surface-2 px-3 text-micro font-bold text-fg transition-colors duration-150 hover:border-line-hover hover:bg-surface-3"
      >
        {open && <CloseIcon size={16} />}
        <span lang="en">DEV</span>
      </button>
    </div>
  );
}
