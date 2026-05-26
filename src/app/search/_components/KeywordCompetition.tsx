"use client";

import { useMemo, useState } from "react";
import type { Video } from "@/types";

interface Props {
  videos: Video[];
  query: string;
}

function formatCount(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}만`;
  return n.toLocaleString();
}

type Level = "낮음" | "보통" | "높음";

interface CompetitionResult {
  score: number;
  level: Level;
  recentUploadRatio: number;
  avgTopViewCount: number;
  bigChannelRatio: number;
}

// 사용자 옵트인 후 클라이언트에서만 실행 (ToS III.E.4h 회피)
function analyzeCompetition(videos: Video[]): CompetitionResult {
  if (videos.length === 0) {
    return { score: 0, level: "낮음", recentUploadRatio: 0, avgTopViewCount: 0, bigChannelRatio: 0 };
  }
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recentCount = videos.filter((v) => now - v.publishedAtRaw < thirtyDaysMs).length;
  const recentUploadRatio = recentCount / videos.length;
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);
  const top10 = sorted.slice(0, 10);
  const avgTopViewCount = top10.reduce((sum, v) => sum + v.viewCount, 0) / top10.length;
  const bigChannelCount = videos.filter((v) => v.subscriberCountRaw >= 100_000).length;
  const bigChannelRatio = bigChannelCount / videos.length;
  const minLog = Math.log10(1_000);
  const maxLog = Math.log10(10_000_000);
  const viewLog = Math.log10(Math.max(avgTopViewCount, 1));
  const normalizedViews = Math.min(30, Math.max(0, ((viewLog - minLog) / (maxLog - minLog)) * 30));
  const score = Math.min(100, Math.max(0, Math.round(recentUploadRatio * 40 + normalizedViews + bigChannelRatio * 30)));
  let level: Level;
  if (score <= 35) level = "낮음";
  else if (score <= 65) level = "보통";
  else level = "높음";
  return { score, level, recentUploadRatio, avgTopViewCount, bigChannelRatio };
}

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; text: string; stroke: string; recommendation: string }> = {
  "낮음": {
    color: "text-teal-400", bg: "bg-teal-900/40", border: "border-teal-700/50",
    text: "text-teal-300", stroke: "stroke-teal-400",
    recommendation: "경쟁이 적어 진입하기 좋은 키워드입니다",
  },
  "보통": {
    color: "text-yellow-400", bg: "bg-yellow-900/40", border: "border-yellow-700/50",
    text: "text-yellow-300", stroke: "stroke-yellow-400",
    recommendation: "적당한 경쟁이 있지만 차별화된 콘텐츠로 승부할 수 있습니다",
  },
  "높음": {
    color: "text-red-400", bg: "bg-red-900/40", border: "border-red-700/50",
    text: "text-red-300", stroke: "stroke-red-400",
    recommendation: "경쟁이 치열합니다. 니치한 세부 키워드를 노려보세요",
  },
};

function CircularProgress({ score, level }: { score: number; level: Level }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const config = LEVEL_CONFIG[level];
  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-800" />
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={config.stroke}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${config.color}`}>{score}</span>
      </div>
    </div>
  );
}

export default function KeywordCompetition({ videos, query }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const result = useMemo(() => (enabled ? analyzeCompetition(videos) : null), [videos, enabled]);

  if (videos.length === 0) return null;

  // ─── 비활성 상태: 옵트인 버튼만 표시 ───
  if (!result) {
    return (
      <>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400">
              📊
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                <span className="text-teal-400">{query}</span> 키워드 경쟁도 분석
              </p>
              <p className="text-[11px] text-gray-500">사용자 자가 계산 도구 (YouTube 공식 메트릭 아님)</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-4 py-2 bg-teal-600/20 hover:bg-teal-600/40 border border-teal-700/60 hover:border-teal-500 text-teal-300 text-xs font-semibold rounded-lg transition"
          >
            ⚡ 경쟁도 분석 시작
          </button>
        </div>

        {/* 확인 모달 */}
        {confirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="absolute inset-0" onClick={() => setConfirmOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900 text-center mb-3">키워드 경쟁도 분석</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed mb-2">
                경쟁도 분석을 진행하시겠습니까?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-4">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  ※ 이 도구는 사용자가 직접 활성화하는 자가 계산 도구입니다.
                  YouTube 공식 메트릭이 아니며, bibl lab의 평가 지표가 아닙니다.
                  공개된 데이터를 사용자 브라우저에서 단순 산술로 처리한 참고 값입니다.
                </p>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2.5 border border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg font-medium text-sm transition">
                  취소
                </button>
                <button onClick={() => { setEnabled(true); setConfirmOpen(false); }} className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold text-sm transition">
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── 활성 상태: 경쟁도 결과 표시 ───
  const config = LEVEL_CONFIG[result.level];
  const metrics = [
    { label: "최근 30일 업로드 비율", value: `${Math.round(result.recentUploadRatio * 100)}%` },
    { label: "상위 영상 평균 조회수", value: formatCount(Math.round(result.avgTopViewCount)) },
    { label: "대형 채널(10만+) 비율", value: `${Math.round(result.bigChannelRatio * 100)}%` },
  ];

  return (
    <div className="space-y-2">
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-4">
          <CircularProgress score={result.score} level={result.level} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-medium text-gray-300">
                <span className="text-white font-semibold">{query}</span> 키워드 경쟁도
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.border} border ${config.text}`}>
                {result.level}
              </span>
              <span className="text-[10px] text-gray-600 ml-1">사용자 자가 계산</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-0.5">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-500">{m.label}</span>
                  <span className="text-gray-200 font-medium">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 max-w-[240px] flex-shrink-0 hidden sm:block">
            {config.recommendation}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 px-1">
        ※ 위 점수/등급/추천은 사용자가 직접 활성화한 자가 계산 결과입니다. YouTube 공식 메트릭이 아니며, bibl lab이 제공하는 평가가 아닙니다.
      </p>
    </div>
  );
}
