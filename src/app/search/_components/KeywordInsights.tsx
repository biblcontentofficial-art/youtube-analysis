"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Video } from "@/types";

/**
 * 키워드 인사이트 통합 모듈
 *
 * 포함 기능:
 * - Phase 1.1: AI 키워드 진단 (사용자 옵트인, 외부 LLM 호출)
 * - Phase 1.2: 상위 영상 패턴 분석 (단순 빈도 통계, ToS 안전)
 * - Phase 1.3: 관련 키워드 자동 추천 (YouTube autocomplete, ToS 안전)
 * - Phase 3.8: 비블 컨설팅 연결 CTA
 */

interface Props {
  videos: Video[];
  query: string;
}

// ─── 1.2: 상위 영상 패턴 (단순 빈도 통계) ───
function computePatterns(videos: Video[]) {
  if (videos.length === 0) return null;
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 30);

  // 1) 평균 길이 (단순 산술 평균)
  const durations = sorted.filter((v) => (v.durationSeconds ?? 0) > 0).map((v) => v.durationSeconds!);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : 0;

  // 2) 쇼츠 vs 롱폼 비율
  const shortsCount = sorted.filter((v) => (v.durationSeconds ?? 9999) <= 180).length;
  const longCount = sorted.length - shortsCount;

  // 3) 제목 단어 빈도 (한글/영문 단어 단순 카운트, 의미 없는 단어 제외)
  const stopWords = new Set([
    "the", "a", "an", "of", "in", "on", "is", "are", "to", "for", "with", "and", "or",
    "이", "그", "저", "것", "수", "들", "및", "와", "과", "의", "을", "를", "에", "은", "는", "이", "가", "도", "만", "더", "또", "안", "내",
  ]);
  const wordCount: Record<string, number> = {};
  sorted.forEach((v) => {
    const words = v.title
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w));
    new Set(words).forEach((w) => {
      wordCount[w] = (wordCount[w] ?? 0) + 1;
    });
  });
  const topWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // 4) 시간대 분포 (게시 시간)
  const hourCount: Record<number, number> = {};
  sorted.forEach((v) => {
    if (!v.publishedAtRaw) return;
    const hour = new Date(v.publishedAtRaw).getHours();
    hourCount[hour] = (hourCount[hour] ?? 0) + 1;
  });
  const peakHour = Object.entries(hourCount).sort(([, a], [, b]) => b - a)[0];

  return {
    avgDuration,
    shortsCount,
    longCount,
    topWords,
    peakHour: peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null,
    totalAnalyzed: sorted.length,
  };
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${s}초`;
}

export default function KeywordInsights({ videos, query }: Props) {
  // ─── AI 진단 상태 ───
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ─── 패턴 분석 옵트인 ───
  const [patternsEnabled, setPatternsEnabled] = useState(false);
  const patterns = useMemo(() => (patternsEnabled ? computePatterns(videos) : null), [videos, patternsEnabled]);

  // ─── 관련 키워드 (YouTube autocomplete) ───
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [related, setRelated] = useState<string[] | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  if (videos.length === 0) return null;

  // ─── 핸들러: AI 진단 ───
  async function handleAiDiagnose() {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);
      const top10 = sorted.slice(0, 10);
      const avgViews = Math.round(top10.reduce((s, v) => s + v.viewCount, 0) / top10.length);
      const recentCount = videos.filter((v) => Date.now() - (v.publishedAtRaw ?? 0) < 30 * 24 * 60 * 60 * 1000).length;
      const bigCh = videos.filter((v) => (v.subscriberCountRaw ?? 0) >= 100_000).length;

      const res = await fetch("/api/keyword-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          totalResults: videos.length,
          topAvgViews: avgViews,
          recentRatio: recentCount / videos.length,
          bigChannelRatio: bigCh / videos.length,
          topVideoTitles: top10.map((v) => v.title),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.message || "AI 진단에 실패했습니다.");
        return;
      }
      setAiResult(data.text);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI 진단 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  // ─── 핸들러: ChatGPT 새 탭 백업 ───
  function handleOpenChatGPT() {
    const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
    const prompt =
      `유튜브 키워드 "${query}" 시장 진단:\n` +
      `검색 결과 ${videos.length}개, 상위 10개 영상 제목:\n` +
      sorted.map((v, i) => `${i + 1}. ${v.title}`).join("\n") +
      `\n\n이 키워드의 (1) 시장 포화도, (2) 차별화 앵글 3가지, (3) 추천 영상 형식, (4) 흔한 실수를 한국어로 간단히 분석해줘.`;
    window.open(`https://chat.openai.com/?prompt=${encodeURIComponent(prompt)}`, "_blank", "noopener,noreferrer");
  }

  // ─── 핸들러: 관련 키워드 (YouTube autocomplete) ───
  async function handleRelated() {
    setRelatedLoading(true);
    setRelatedError(null);
    setRelated(null);
    try {
      const res = await fetch(`/api/keyword-suggest?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setRelatedError(data.message || "관련 키워드를 가져올 수 없습니다.");
        return;
      }
      setRelated(data.suggestions || []);
    } catch (e) {
      setRelatedError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setRelatedLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* ─── 상단 액션 바 (3가지 도구 + 컨설팅 CTA) ─── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-bold text-white">
                <span className="text-teal-400">{query}</span> 키워드 인사이트
              </p>
              <p className="text-[11px] text-gray-500">사용자가 직접 활성화하는 분석 도구 모음</p>
            </div>
          </div>
          <Link
            href={`/studio/consulting?source=keyword&query=${encodeURIComponent(query)}`}
            className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap"
            title="비블에게 직접 키워드 컨설팅 받기"
          >
            🎯 비블에게 컨설팅 받기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleAiDiagnose}
            disabled={aiLoading}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-50 border border-purple-700/60 hover:border-purple-500 text-purple-300 text-xs font-medium rounded-lg transition"
          >
            {aiLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                AI 진단 중...
              </>
            ) : (
              <>🤖 AI에게 진단 받기</>
            )}
          </button>
          <button
            onClick={() => setPatternsEnabled(true)}
            disabled={patternsEnabled}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600/20 hover:bg-blue-600/40 disabled:opacity-50 border border-blue-700/60 hover:border-blue-500 text-blue-300 text-xs font-medium rounded-lg transition"
          >
            📈 상위 영상 패턴 보기
          </button>
          <button
            onClick={handleRelated}
            disabled={relatedLoading}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-600/20 hover:bg-amber-600/40 disabled:opacity-50 border border-amber-700/60 hover:border-amber-500 text-amber-300 text-xs font-medium rounded-lg transition"
          >
            {relatedLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                불러오는 중...
              </>
            ) : (
              <>🔗 연관 키워드 추천</>
            )}
          </button>
        </div>
      </div>

      {/* ─── AI 진단 결과 ─── */}
      {aiResult && (
        <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-bold text-purple-300">🤖 AI 키워드 진단</h3>
            <button onClick={() => setAiResult(null)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
          </div>
          <p className="text-[10px] text-gray-500 mb-3">
            ※ 외부 AI(OpenAI/Anthropic)가 생성한 텍스트입니다. bibl lab의 평가/메트릭이 아닙니다.
          </p>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{aiResult}</div>
        </div>
      )}

      {aiError && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-bold text-amber-300">⚠️ AI 진단을 사용할 수 없습니다</h3>
            <button onClick={() => setAiError(null)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
          </div>
          <p className="text-xs text-gray-400 mb-3">{aiError}</p>
          <button onClick={handleOpenChatGPT} className="px-3 py-2 bg-amber-700/40 hover:bg-amber-700/60 text-amber-200 text-xs font-medium rounded-lg border border-amber-700/60">
            🔗 ChatGPT에서 분석 요청 (새 탭)
          </button>
        </div>
      )}

      {/* ─── 상위 영상 패턴 (Phase 1.2) ─── */}
      {patterns && (
        <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-blue-300">📈 상위 {patterns.totalAnalyzed}개 영상 패턴 (단순 빈도 통계)</h3>
            <button onClick={() => setPatternsEnabled(false)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-900/60 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 mb-1">평균 영상 길이</div>
              <div className="text-white font-bold">{formatDuration(patterns.avgDuration)}</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 mb-1">롱폼 / 쇼츠</div>
              <div className="text-white font-bold">{patterns.longCount} / {patterns.shortsCount}개</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 mb-1">분석 영상 수</div>
              <div className="text-white font-bold">{patterns.totalAnalyzed}개</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 mb-1">최다 게시 시간대</div>
              <div className="text-white font-bold">{patterns.peakHour ? `${patterns.peakHour.hour}시 (${patterns.peakHour.count}개)` : "-"}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-400 mb-2">제목에 자주 등장하는 단어 TOP 10</div>
            <div className="flex flex-wrap gap-1.5">
              {patterns.topWords.map((w) => (
                <span key={w.word} className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300">
                  {w.word} <span className="text-gray-500">·{w.count}</span>
                </span>
              ))}
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-600">
            ※ 위 통계는 YouTube가 제공한 데이터를 사용자의 브라우저에서 단순 카운트한 것입니다. 평가/순위가 아니며 참고용입니다.
          </p>
        </div>
      )}

      {/* ─── 연관 키워드 (Phase 1.3) ─── */}
      {related && related.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-amber-300">🔗 연관 키워드 (YouTube 자동완성)</h3>
            <button onClick={() => setRelated(null)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
          </div>
          <p className="text-[11px] text-gray-500 mb-3">
            아래 키워드를 클릭하면 새 검색이 시작됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {related.map((kw) => (
              <Link
                key={kw}
                href={`/search?q=${encodeURIComponent(kw)}`}
                className="px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/60 hover:border-amber-500 text-amber-200 text-xs rounded-full transition"
              >
                {kw}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-gray-600">
            ※ YouTube가 직접 제공하는 자동완성 데이터입니다.
          </p>
        </div>
      )}

      {relatedError && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 text-xs text-red-300">
          {relatedError}
        </div>
      )}
    </div>
  );
}
