"use client";

import { useState, useMemo } from "react";
import type { ThreadPost } from "@/lib/threads";
import { analyzeHashtags, type HashtagStat } from "@/lib/threads";

function fmtNum(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const GRADE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30" },
  B: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  C: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  D: { bg: "bg-gray-700/50", text: "text-gray-500", border: "border-gray-600" },
};

interface Props {
  posts: ThreadPost[];
}

export default function HashtagAnalysis({ posts }: Props) {
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => analyzeHashtags(posts), [posts]);
  const top10 = stats.slice(0, 10);

  if (top10.length === 0) return null;

  const best = top10[0];
  const maxAvg = Math.max(...top10.map((s) => s.avgEngagement), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">#해시태그 분석</span>
          <span className="text-xs text-gray-600">{stats.length}개 해시태그 발견</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* 베스트 해시태그 */}
          <div className="bg-gray-800/50 rounded-xl p-3 text-sm">
            <span className="text-gray-500">가장 반응 좋은 태그: </span>
            <span className="text-teal-400 font-medium">{best.tag}</span>
            <span className="text-gray-500"> — 평균 반응 {fmtNum(best.avgEngagement)}, {best.count}회 사용</span>
          </div>

          {/* 태그 리스트 */}
          <div className="space-y-2">
            {top10.map((s) => {
              const g = GRADE_STYLE[s.grade] ?? GRADE_STYLE.D;
              return (
                <div key={s.tag} className="flex items-center gap-3">
                  {/* 등급 */}
                  <span className={`w-7 text-center text-xs font-bold px-1.5 py-0.5 rounded ${g.bg} ${g.text} border ${g.border}`}>
                    {s.grade}
                  </span>

                  {/* 태그명 */}
                  <span className="text-sm text-gray-300 w-28 truncate">{s.tag}</span>

                  {/* 바 */}
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.max((s.avgEngagement / maxAvg) * 100, 4)}%` }}
                    />
                  </div>

                  {/* 수치 */}
                  <div className="text-right w-20">
                    <span className="text-xs text-white font-medium">{fmtNum(s.avgEngagement)}</span>
                    <span className="text-xs text-gray-600 ml-1">({s.count})</span>
                  </div>
                </div>
              );
            })}
          </div>

          {stats.length > 10 && (
            <p className="text-xs text-gray-600 text-center">
              외 {stats.length - 10}개 해시태그
            </p>
          )}
        </div>
      )}
    </div>
  );
}
