"use client";

import { useState } from "react";

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

export default function DevToolbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {open && (
        <div className="mb-2 rounded-xl border border-yellow-500/40 bg-gray-950/95 backdrop-blur shadow-2xl w-48 overflow-hidden">
          {/* 헤더 */}
          <div className="px-3 py-2 border-b border-yellow-500/20 bg-yellow-500/10 flex items-center justify-between">
            <span className="text-yellow-400 font-bold tracking-wide text-[10px] uppercase">Dev Nav</span>
            <span className="text-yellow-600 text-[10px]">localhost</span>
          </div>
          {/* 페이지 목록 */}
          <div className="py-1">
            {PAGES.map((p) => {
              const isCurrent =
                typeof window !== "undefined" &&
                window.location.pathname === p.href;
              return (
                <a
                  key={p.href}
                  href={p.href}
                  className={`flex items-center justify-between px-3 py-1.5 hover:bg-yellow-500/10 transition ${
                    isCurrent ? "text-yellow-400 bg-yellow-500/5" : "text-gray-300"
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-gray-600 text-[9px]">{p.href}</span>
                </a>
              );
            })}
          </div>
          {/* 현재 경로 */}
          <div className="px-3 py-2 border-t border-yellow-500/20 bg-gray-900/60 text-gray-600 text-[10px] truncate">
            {typeof window !== "undefined" ? window.location.pathname : ""}
          </div>
        </div>
      )}

      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg transition text-[11px] select-none"
        title="개발 모드 네비게이션"
      >
        <span>{open ? "✕" : "⚡"}</span>
        <span>DEV</span>
      </button>
    </div>
  );
}
