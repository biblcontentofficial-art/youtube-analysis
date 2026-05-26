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
  type Provider = "openai" | "anthropic" | "gemini" | "grok";
  const [aiLoading, setAiLoading] = useState<Provider | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ─── 패턴 분석 옵트인 ───
  const [patternsEnabled, setPatternsEnabled] = useState(false);
  const patterns = useMemo(() => (patternsEnabled ? computePatterns(videos) : null), [videos, patternsEnabled]);

  // ─── 관련 키워드 (YouTube autocomplete) ───
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [related, setRelated] = useState<string[] | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  if (videos.length === 0) return null;

  // ─── 핸들러: AI 진단 (provider 선택) ───
  async function handleAiDiagnose(provider: Provider) {
    setAiLoading(provider);
    setAiError(null);
    setAiResult(null);
    setAiProvider(null);
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
          provider,
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
      setAiProvider(data.providerLabel || provider);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI 진단 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(null);
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

  // ─── SVG 아이콘 컴포넌트들 ───
  const Icon = {
    spark: (cls = "w-5 h-5") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
      </svg>
    ),
    arrow: (cls = "w-4 h-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    ),
    brain: (cls = "w-5 h-5") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v15A2.5 2.5 0 0 0 9.5 22h0a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 9.5 2zM14.5 2A2.5 2.5 0 0 1 17 4.5v15a2.5 2.5 0 0 1-2.5 2.5h0a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 14.5 2zM3 12h4M17 12h4M5 7l2 1M17 8l2-1M5 17l2-1M17 16l2 1" />
      </svg>
    ),
    chart: (cls = "w-5 h-5") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-6 4 4 5-8" />
      </svg>
    ),
    link: (cls = "w-5 h-5") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07l-1.41 1.41" />
        <path d="M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 0 0 7.07 7.07l1.41-1.41" />
      </svg>
    ),
    close: (cls = "w-4 h-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    warning: (cls = "w-5 h-5") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
      </svg>
    ),
    external: (cls = "w-4 h-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    ),
  };

  return (
    <div className="space-y-4">
      {/* ─── 상단 액션 바 (3가지 도구 + 컨설팅 CTA) ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5 md:p-6">
        {/* 배경 글로우 */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-violet-500/[0.04] blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/15 to-teal-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                {Icon.spark("w-5 h-5")}
              </div>
              <div>
                <p className="text-lg font-bold text-white tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">{query}</span>
                  <span className="ml-2 text-white/90">키워드 인사이트</span>
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">사용자가 직접 활성화하는 분석 도구 모음</p>
              </div>
            </div>
            <Link
              href={`/studio/consulting?source=keyword&query=${encodeURIComponent(query)}`}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-teal-900/30 whitespace-nowrap"
              title="이 키워드로 유튜브 채널 대행 문의하기"
            >
              유튜브 채널 대행 문의
              <span className="transition-transform group-hover:translate-x-0.5">{Icon.arrow("w-4 h-4")}</span>
            </Link>
          </div>

          {/* ─ AI 진단 (4개 provider 중 선택) ─ */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-md bg-violet-500/15 border border-violet-400/25 flex items-center justify-center text-violet-300">
                {Icon.brain("w-3.5 h-3.5")}
              </div>
              <p className="text-sm font-semibold text-violet-200">AI에게 진단 받기</p>
              <span className="text-[11px] text-slate-500">— 원하는 AI를 선택하세요</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {([
                { id: "openai", label: "ChatGPT", sub: "OpenAI", color: "emerald" },
                { id: "gemini", label: "Gemini", sub: "Google", color: "sky" },
                { id: "anthropic", label: "Claude", sub: "Anthropic", color: "orange" },
                { id: "grok", label: "Grok", sub: "xAI", color: "slate" },
              ] as const).map((p) => {
                const isLoading = aiLoading === p.id;
                const anyLoading = aiLoading !== null;
                const colorMap: Record<string, string> = {
                  emerald: "from-emerald-500/[0.08] to-teal-500/[0.05] hover:from-emerald-500/20 hover:to-teal-500/15 border-emerald-400/20 hover:border-emerald-400/50 text-emerald-200",
                  sky: "from-sky-500/[0.08] to-blue-500/[0.05] hover:from-sky-500/20 hover:to-blue-500/15 border-sky-400/20 hover:border-sky-400/50 text-sky-200",
                  orange: "from-orange-500/[0.08] to-amber-500/[0.05] hover:from-orange-500/20 hover:to-amber-500/15 border-orange-400/20 hover:border-orange-400/50 text-orange-200",
                  slate: "from-slate-500/[0.10] to-zinc-500/[0.06] hover:from-slate-500/25 hover:to-zinc-500/20 border-slate-400/25 hover:border-slate-300/50 text-slate-200",
                };
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAiDiagnose(p.id)}
                    disabled={anyLoading}
                    className={`group flex flex-col items-center justify-center gap-1 px-3 py-3.5 bg-gradient-to-br ${colorMap[p.color]} disabled:opacity-40 disabled:cursor-not-allowed border rounded-xl transition hover:text-white`}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin my-1.5" />
                    ) : (
                      <span className="text-sm font-bold tracking-tight">{p.label}</span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider opacity-60">
                      {isLoading ? "분석 중..." : p.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─ 그 외 도구 (패턴, 연관 키워드) ─ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPatternsEnabled(true)}
              disabled={patternsEnabled}
              className="group flex items-center justify-center gap-2.5 px-4 py-4 bg-gradient-to-br from-sky-500/[0.08] to-blue-500/[0.05] hover:from-sky-500/20 hover:to-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed border border-sky-400/20 hover:border-sky-400/50 text-sky-200 hover:text-white text-sm font-semibold rounded-xl transition"
            >
              {Icon.chart("w-5 h-5")}
              상위 영상 패턴 보기
            </button>
            <button
              onClick={handleRelated}
              disabled={relatedLoading}
              className="group flex items-center justify-center gap-2.5 px-4 py-4 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.05] hover:from-amber-500/20 hover:to-orange-500/15 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/20 hover:border-amber-400/50 text-amber-200 hover:text-white text-sm font-semibold rounded-xl transition"
            >
              {relatedLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                  불러오는 중...
                </>
              ) : (
                <>
                  {Icon.link("w-5 h-5")}
                  연관 키워드 추천
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── AI 진단 결과 ─── */}
      {aiResult && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-950/40 via-slate-950 to-slate-950 p-6">
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-500/[0.06] blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-400/25 flex items-center justify-center text-violet-300">
                  {Icon.brain("w-4 h-4")}
                </div>
                <h3 className="text-base font-bold text-violet-200">
                  AI 키워드 진단
                  {aiProvider && <span className="ml-2 text-xs font-medium text-violet-300/70">by {aiProvider}</span>}
                </h3>
              </div>
              <button onClick={() => { setAiResult(null); setAiProvider(null); }} className="text-slate-500 hover:text-slate-300 transition">{Icon.close()}</button>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              외부 AI({aiProvider || "OpenAI/Anthropic/Google/xAI"})가 생성한 텍스트입니다. bibl lab의 평가/메트릭이 아닙니다.
            </p>
            <div className="text-[15px] text-slate-200 whitespace-pre-wrap leading-relaxed">{aiResult}</div>
          </div>
        </div>
      )}

      {aiError && (
        <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/30 to-slate-950 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300">
                {Icon.warning("w-4 h-4")}
              </div>
              <h3 className="text-base font-bold text-amber-200">AI 진단을 사용할 수 없습니다</h3>
            </div>
            <button onClick={() => setAiError(null)} className="text-slate-500 hover:text-slate-300 transition">{Icon.close()}</button>
          </div>
          <p className="text-sm text-slate-400 mb-4">{aiError}</p>
          <button onClick={handleOpenChatGPT} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-sm font-semibold rounded-lg border border-amber-400/30 hover:border-amber-400/50 transition">
            {Icon.external()}
            ChatGPT에서 분석 요청 (새 탭)
          </button>
        </div>
      )}

      {/* ─── 상위 영상 패턴 (Phase 1.2) ─── */}
      {patterns && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-400/15 bg-gradient-to-br from-sky-950/30 via-slate-950 to-slate-950 p-6">
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sky-500/[0.05] blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-300">
                  {Icon.chart("w-4 h-4")}
                </div>
                <h3 className="text-base font-bold text-sky-200">상위 {patterns.totalAnalyzed}개 영상 패턴</h3>
              </div>
              <button onClick={() => setPatternsEnabled(false)} className="text-slate-500 hover:text-slate-300 transition">{Icon.close()}</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "평균 영상 길이", value: formatDuration(patterns.avgDuration) },
                { label: "롱폼 / 쇼츠", value: `${patterns.longCount} / ${patterns.shortsCount}개` },
                { label: "분석 영상 수", value: `${patterns.totalAnalyzed}개` },
                { label: "최다 게시 시간대", value: patterns.peakHour ? `${patterns.peakHour.hour}시 (${patterns.peakHour.count}개)` : "-" },
              ].map((m) => (
                <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-[11px] text-slate-500 mb-1.5">{m.label}</div>
                  <div className="text-white text-base font-bold tracking-tight">{m.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-300 mb-3">제목에 자주 등장하는 단어 TOP 10</div>
              <div className="flex flex-wrap gap-2">
                {patterns.topWords.map((w) => (
                  <span key={w.word} className="px-3 py-1.5 bg-sky-500/[0.08] border border-sky-400/20 rounded-full text-sm text-sky-100">
                    {w.word} <span className="text-sky-400/70 ml-1 text-xs">×{w.count}</span>
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-5 text-[11px] text-slate-500">
              위 통계는 YouTube가 제공한 데이터를 사용자의 브라우저에서 단순 카운트한 것입니다. 평가/순위가 아니며 참고용입니다.
            </p>
          </div>
        </div>
      )}

      {/* ─── 연관 키워드 (Phase 1.3) ─── */}
      {related && related.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 p-6">
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/[0.05] blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300">
                  {Icon.link("w-4 h-4")}
                </div>
                <h3 className="text-base font-bold text-amber-200">연관 키워드</h3>
              </div>
              <button onClick={() => setRelated(null)} className="text-slate-500 hover:text-slate-300 transition">{Icon.close()}</button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              아래 키워드를 클릭하면 새 검색이 시작됩니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {related.map((kw) => (
                <Link
                  key={kw}
                  href={`/search?q=${encodeURIComponent(kw)}`}
                  className="px-3.5 py-2 bg-amber-500/[0.08] hover:bg-amber-500/[0.18] border border-amber-400/25 hover:border-amber-400/50 text-amber-100 hover:text-white text-sm font-medium rounded-full transition"
                >
                  {kw}
                </Link>
              ))}
            </div>
            <p className="mt-5 text-[11px] text-slate-500">
              YouTube가 직접 제공하는 자동완성 데이터입니다.
            </p>
          </div>
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
