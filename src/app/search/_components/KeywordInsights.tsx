"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import type { Video } from "@/types";
import { buttonClass, cx } from "@/components/ui/button";
import { CHIP } from "@/components/ui/chip";
import { CloseIcon, WarningIcon } from "@/components/ui/icons";

/**
 * 키워드 인사이트 통합 모듈
 *
 * 포함 기능:
 * - Phase 1.1: AI 키워드 진단 (사용자 옵트인, 외부 LLM 호출)
 * - Phase 1.2: 상위 영상 패턴 분석 (단순 빈도 통계, ToS 안전)
 * - Phase 1.3: 관련 키워드 자동 추천 (YouTube autocomplete, ToS 안전)
 *
 * 패널은 접힌 채로 시작하고, 검색 결과 위 분석 도구 줄의 버튼이 open 으로 펼친다.
 * 컨설팅 연결 링크('유튜브 채널 대행 문의')는 분석 도구 줄 오른쪽 글자 링크로 옮겼다(SearchResultList).
 */

export type InsightsTool = "patterns" | "related";

interface Props {
  videos: Video[];
  query: string;
  /**
   * 분석 도구 줄이 펼친 도구. "patterns" 면 상위 영상 패턴을 계산해 보여 주고, "related" 면 연관 키워드를 불러온다.
   * 넘기지 않으면 이 컴포넌트가 직접 두 도구 버튼을 그린다(분석 도구 줄이 없는 곳).
   */
  open?: InsightsTool | null;
  onClose?: () => void;
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

export default function KeywordInsights({ videos, query, open, onClose }: Props) {
  // 분석 도구 줄이 없을 때는 이 컴포넌트가 직접 도구 버튼을 그리고 열림 상태를 갖는다
  const controlled = open !== undefined;
  const [selfOpen, setSelfOpen] = useState<InsightsTool | null>(null);
  const tool = controlled ? open : selfOpen;
  const patternsTitleId = useId();
  const relatedTitleId = useId();
  const close = () => (controlled ? onClose?.() : setSelfOpen(null));

  // ─── 패턴 분석 옵트인 ───
  const patternsEnabled = tool === "patterns";
  const patterns = useMemo(() => (patternsEnabled ? computePatterns(videos) : null), [videos, patternsEnabled]);

  // ─── 관련 키워드 (YouTube autocomplete) ───
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [related, setRelated] = useState<string[] | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  // 연관 키워드 도구를 펼칠 때마다 새로 불러온다(전에는 버튼을 누를 때마다 불러왔다)
  useEffect(() => {
    if (tool === "related") void handleRelated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, query]);

  if (videos.length === 0) return null;

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

  /** 패널 틀: 1px 선 + surface 단색(DESIGN 6.7 앱 카드). 그라데이션·블러·아이콘 상자 없음 */
  const PANEL = "rounded-card border border-line bg-surface p-5";
  const CLOSE_BUTTON =
    "-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg";

  return (
    <div className="space-y-4">
      {/* ─── 도구 버튼 (분석 도구 줄이 없는 곳에서만) ─── */}
      {!controlled && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelfOpen("patterns")}
            aria-pressed={tool === "patterns"}
            className={cx(buttonClass({ variant: "secondary", size: "sm" }), "px-3 pointer-coarse:h-11 aria-pressed:border-line-hover aria-pressed:bg-surface-3")}
          >
            상위 영상 패턴 보기
          </button>
          <button
            type="button"
            onClick={() => (tool === "related" ? void handleRelated() : setSelfOpen("related"))}
            disabled={relatedLoading}
            aria-pressed={tool === "related"}
            className={cx(buttonClass({ variant: "secondary", size: "sm" }), "px-3 pointer-coarse:h-11 aria-pressed:border-line-hover aria-pressed:bg-surface-3")}
          >
            연관 키워드 추천
          </button>
        </div>
      )}

      {/* ─── 상위 영상 패턴 (Phase 1.2) ─── */}
      {patterns && (
        <section aria-labelledby={patternsTitleId} className={PANEL}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 id={patternsTitleId} className="text-body font-semibold text-fg">상위 {patterns.totalAnalyzed}개 영상 패턴</h3>
            <button type="button" onClick={close} aria-label="상위 영상 패턴 닫기" className={CLOSE_BUTTON}>
              <CloseIcon size={16} />
            </button>
          </div>

          <dl className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "평균 영상 길이", value: formatDuration(patterns.avgDuration) },
              { label: "롱폼 / 쇼츠", value: `${patterns.longCount} / ${patterns.shortsCount}개` },
              { label: "분석 영상 수", value: `${patterns.totalAnalyzed}개` },
              { label: "최다 게시 시간대", value: patterns.peakHour ? `${patterns.peakHour.hour}시 (${patterns.peakHour.count}개)` : "-" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col-reverse gap-1.5 rounded-control border border-line-soft bg-surface-2 p-4">
                <dt className="text-micro text-fg-3">{m.label}</dt>
                <dd className="tnum text-body font-bold tracking-[-0.01em] text-fg">{m.value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h4 className="mb-3 text-body-sm font-semibold text-fg-2">제목에 자주 등장하는 단어 TOP 10</h4>
            <ul className="flex flex-wrap gap-1.5">
              {patterns.topWords.map((w) => (
                <li key={w.word} className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-2.5 text-caption font-medium text-fg-2">
                  {w.word} <span className="tnum text-micro text-fg-3">×{w.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 text-micro text-fg-3">
            위 통계는 YouTube가 제공한 데이터를 사용자의 브라우저에서 단순 카운트한 것입니다. 평가/순위가 아니며 참고용입니다.
          </p>
        </section>
      )}

      {/* ─── 연관 키워드 (Phase 1.3) ─── */}
      {tool === "related" && (relatedLoading || (related && related.length > 0)) && (
        <section aria-labelledby={relatedTitleId} className={PANEL} aria-busy={relatedLoading}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 id={relatedTitleId} className="text-body font-semibold text-fg">연관 키워드</h3>
            <button type="button" onClick={close} aria-label="연관 키워드 닫기" className={CLOSE_BUTTON}>
              <CloseIcon size={16} />
            </button>
          </div>
          {relatedLoading ? (
            <p role="status" className="flex items-center gap-2 text-body-sm text-fg-3">
              <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-fg-2" />
              불러오는 중...
            </p>
          ) : (
            <>
              <p className="mb-4 text-body-sm text-fg-3">
                아래 키워드를 클릭하면 새 검색이 시작됩니다. <span className="whitespace-nowrap">누르면 검색 1회가 차감됩니다.</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {related!.map((kw) => (
                  <Link
                    key={kw}
                    href={`/search?q=${encodeURIComponent(kw)}`}
                    className={CHIP}
                  >
                    {kw}
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-micro text-fg-3">
                YouTube가 직접 제공하는 자동완성 데이터입니다.
              </p>
            </>
          )}
        </section>
      )}

      {tool === "related" && relatedError && (
        <div role="alert" className="flex items-start gap-3 rounded-card border border-negative/55 bg-surface p-4">
          <WarningIcon size={20} className="text-negative" />
          <p className="min-w-0 flex-1 text-body-sm text-fg-2">{relatedError}</p>
          <button type="button" onClick={close} aria-label="연관 키워드 닫기" className={CLOSE_BUTTON}>
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
