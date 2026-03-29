"use client";

import { useState, useMemo } from "react";
import { Video } from "@/types";

interface PatternDef {
  key: string;
  label: string;
  color: string;
  desc: string;
  example: string;
  test: (title: string) => boolean;
}

const PATTERN_DEFS: PatternDef[] = [
  {
    key: "number",
    label: "숫자형",
    color: "bg-blue-500",
    desc: "숫자로 정보량을 명확히 제시해 신뢰감을 주는 제목",
    example: "골프 필수 연습법 7가지",
    test: (t) => /\d+\s*(가지|개|선|위|분|초|일|달|번|편|종류|방법)/.test(t),
  },
  {
    key: "question",
    label: "질문형",
    color: "bg-purple-500",
    desc: "시청자의 궁금증을 자극해 클릭을 유도하는 제목",
    example: "왜 골퍼들은 이 드라이버만 쓸까?",
    test: (t) =>
      /[?]/.test(t) ||
      /(어떻게|왜|뭐|무엇|얼마나|몇|할까)/.test(t),
  },
  {
    key: "howto",
    label: "하우투형",
    color: "bg-green-500",
    desc: "방법·팁·노하우를 직접 알려주는 실용적 제목",
    example: "초보도 따라하는 골프 스윙 꿀팁",
    test: (t) =>
      /(방법|하는\s?법|꿀팁|팁|노하우|비법|비결|가이드)/.test(t),
  },
  {
    key: "provocative",
    label: "자극형",
    color: "bg-red-500",
    desc: "강한 감정 반응을 일으켜 클릭을 유도하는 제목",
    example: "이 골퍼 실화임? 역대급 드라이버 레전드",
    test: (t) =>
      /(충격|경악|실화|논란|ㄷㄷ|ㅋㅋ|ㄹㅇ|레전드|역대급|미쳤|대박|충격적|소름|헐)/.test(t),
  },
  {
    key: "comparison",
    label: "비교형",
    color: "bg-yellow-500",
    desc: "두 대상을 맞붙여 선택을 돕는 제목",
    example: "아이언 vs 유틸리티, 뭐가 나을까",
    test: (t) => /(vs|VS|비교|차이|대결)/.test(t),
  },
  {
    key: "review",
    label: "리뷰형",
    color: "bg-cyan-500",
    desc: "제품·장소의 솔직한 사용 경험을 담은 제목",
    example: "10만원대 골프공 한 달 사용 솔직 후기",
    test: (t) =>
      /(리뷰|후기|솔직|사용기|언박싱|개봉기)/.test(t),
  },
];

interface PatternStat {
  key: string;
  label: string;
  color: string;
  count: number;
  avgViews: number;
  goodRatio: number;
}

function formatViews(n: number): string {
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억";
  if (n >= 10_000) return (n / 10_000).toFixed(1) + "만";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "천";
  return n.toLocaleString();
}

export default function TitlePatternAnalysis({
  videos,
}: {
  videos: Video[];
}) {
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const result: PatternStat[] = [];

    for (const def of PATTERN_DEFS) {
      const matched = videos.filter((v) => def.test(v.title));
      const totalViews = matched.reduce((s, v) => s + v.viewCount, 0);
      const goodCount = matched.filter((v) => v.score === "Good").length;

      result.push({
        key: def.key,
        label: def.label,
        color: def.color,
        count: matched.length,
        avgViews: matched.length > 0 ? Math.round(totalViews / matched.length) : 0,
        goodRatio: matched.length > 0 ? Math.round((goodCount / matched.length) * 100) : 0,
      });
    }
    return result;
  }, [videos]);

  const bestPattern = stats.find((s) => s.count > 0) ?? null;
  const maxAvgViews = bestPattern ? bestPattern.avgViews : 1;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-100">
            제목 패턴 분석
          </span>
          <span className="text-[11px] text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">
            최근 30일 업로드 기준
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto_1fr] gap-x-4 text-xs text-gray-500 border-b border-gray-800 pb-2">
            <span>패턴</span>
            <span className="text-right">영상 수</span>
            <span className="text-right">평균 조회수</span>
            <span
              className="cursor-help underline decoration-dotted decoration-gray-600"
              title="구독자 수 대비 조회수가 높고, 업로드 후 빠르게 조회수가 오른 영상을 Good으로 분류합니다"
            >
              반응 Good 비율 ⓘ
            </span>
          </div>

          {/* Pattern rows */}
          {stats.map((s) => {
            const def = PATTERN_DEFS.find((d) => d.key === s.key);
            return (
              <div
                key={s.key}
                className={`grid grid-cols-[1fr_auto_auto_1fr] gap-x-4 items-start transition-opacity ${s.count === 0 ? "opacity-30" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`${s.color} text-white text-xs font-medium px-2.5 py-0.5 rounded-full w-fit`}
                    >
                      {s.label}
                    </span>
                    {s.count > 0 && s.count < 3 && (
                      <span className="text-[10px] text-amber-500 border border-amber-700/60 bg-amber-950/40 px-1.5 py-0.5 rounded">
                        데이터 부족
                      </span>
                    )}
                  </div>
                  {def && (
                    <span className="text-[11px] text-gray-500 leading-snug mt-1">
                      {def.desc}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-300 text-right tabular-nums pt-0.5">
                  {s.count}개
                </span>
                <span className="text-sm text-gray-300 text-right tabular-nums pt-0.5">
                  {s.count > 0 ? formatViews(s.avgViews) : "-"}
                </span>
                <GoodRatioBar ratio={s.goodRatio} hasData={s.count >= 3} />
              </div>
            );
          })}

          {/* 기준 안내 */}
          <p className="text-[10px] text-gray-600 pt-1">
            ※ 반응 Good = 올린 직후 빠르게 퍼지고, 구독자 대비 조회수가 높은 영상 · 영상 3개 미만은 신뢰도가 낮습니다
          </p>

          {/* Best pattern callout */}
          {bestPattern && (
            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center gap-2">
              <span className="text-xs text-gray-500">Best 패턴</span>
              <span
                className={`${bestPattern.color} text-white text-xs font-medium px-2.5 py-0.5 rounded-full`}
              >
                {bestPattern.label}
              </span>
              <span className="text-xs text-gray-400">
                평균 {formatViews(bestPattern.avgViews)} 조회
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 등급 바 컴포넌트 ─────────────────────────────────────────────────────────

function getGrade(ratio: number): {
  grade: string;
  label: string;
  barColor: string;
  badgeColor: string;
} {
  if (ratio >= 80) return { grade: "S", label: "최상",  barColor: "bg-teal-400",   badgeColor: "bg-teal-900/60 text-teal-300 border-teal-700" };
  if (ratio >= 60) return { grade: "A", label: "좋음",  barColor: "bg-green-400",  badgeColor: "bg-green-900/60 text-green-300 border-green-700" };
  if (ratio >= 40) return { grade: "B", label: "보통",  barColor: "bg-yellow-400", badgeColor: "bg-yellow-900/60 text-yellow-300 border-yellow-700" };
  if (ratio >= 20) return { grade: "C", label: "미흡",  barColor: "bg-orange-400", badgeColor: "bg-orange-900/60 text-orange-300 border-orange-700" };
  return              { grade: "D", label: "낮음",  barColor: "bg-gray-600",   badgeColor: "bg-gray-800 text-gray-500 border-gray-700" };
}

function GoodRatioBar({ ratio, hasData }: { ratio: number; hasData: boolean }) {
  if (!hasData) {
    return (
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-2 rounded-full bg-gray-800" />
        <span className="text-xs text-gray-600 tabular-nums w-9 text-right">-</span>
      </div>
    );
  }

  const { grade, label, barColor, badgeColor } = getGrade(ratio);

  return (
    <div className="flex flex-col gap-1 pt-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${ratio}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 tabular-nums w-9 text-right">{ratio}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
          {grade}
        </span>
        <span className="text-[10px] text-gray-500">{label}</span>
      </div>
    </div>
  );
}
