"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <div className="bg-dashboard min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              유튜브 탐색기 v1.0
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white">
              YouTube 데이터 분석
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              유튜브 데이터 분석 솔루션
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = q.trim();
              if (!trimmed) return;
              router.push(`/search?q=${encodeURIComponent(trimmed)}`);
            }}
            className="card rounded-2xl p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <span className="text-lg">⌕</span>
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="궁금한 주제를 검색해보세요 (예: 캠핑, 요리)"
                className="h-12 w-full bg-transparent text-base text-white placeholder:text-white/35 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                검색
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
