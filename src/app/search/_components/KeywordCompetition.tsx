"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Video } from "@/types";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { buttonClass, cx } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";

interface Props {
  videos: Video[];
  query: string;
  /**
   * 분석 도구 줄(SearchResultList)이 패널을 여닫을 때 넘긴다. true 가 되면 처음 한 번 옵트인 확인창을 띄우고,
   * 확인하면 결과를 펼친다(취소하면 onClose). 넘기지 않으면 이 컴포넌트가 직접 '경쟁도 분석 시작' 버튼을 그린다.
   */
  open?: boolean;
  onClose?: () => void;
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

/**
 * 단계 색은 competition-low/mid/high(= positive/caution/negative) 글자·막대에만 쓴다(DESIGN 3.1·6.14).
 * 색만으로 말하지 않게 미터 칸 수(1·2·3)와 '경쟁 낮음/보통/높음' 글자를 언제나 함께 그린다.
 */
const LEVEL_CONFIG: Record<Level, { text: string; fill: string; steps: number; recommendation: string }> = {
  "낮음": {
    text: "text-competition-low", fill: "bg-competition-low", steps: 1,
    recommendation: "경쟁이 적어 진입하기 좋은 키워드입니다",
  },
  "보통": {
    text: "text-competition-mid", fill: "bg-competition-mid", steps: 2,
    recommendation: "적당한 경쟁이 있지만 차별화된 콘텐츠로 승부할 수 있습니다",
  },
  "높음": {
    text: "text-competition-high", fill: "bg-competition-high", steps: 3,
    recommendation: "경쟁이 치열합니다. 니치한 세부 키워드를 노려보세요",
  },
};

/** 3칸 막대 미터(DESIGN 6.14). 채운 칸 수 = 단계. 뜻은 옆 글자가 전하므로 스크린 리더에서는 숨긴다 */
function CompetitionMeter({ level }: { level: Level }) {
  const config = LEVEL_CONFIG[level];
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-[3px]" data-meter-steps={config.steps}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cx("h-1.5 w-3.5 rounded-[1px]", i <= config.steps ? config.fill : "bg-surface-3")} />
      ))}
    </span>
  );
}

const COMPETITION_CONFIRM = {
  // 공용 확인창은 제목(message)과 설명 한 문단(subMessage)만 받는다. 질문과 ※ 고지가 한 문단에 섞이지 않게 질문을 제목에 둔다
  message: "경쟁도 분석을 진행하시겠습니까?",
  subMessage:
    "※ 이 도구는 사용자가 직접 활성화하는 자가 계산 도구입니다. YouTube 공식 메트릭이 아니며, bibl lab의 평가 지표가 아닙니다. 공개된 데이터를 사용자 브라우저에서 단순 산술로 처리한 참고 값입니다.",
};

export default function KeywordCompetition({ videos, query, open, onClose }: Props) {
  const [enabled, setEnabled] = useState(false);
  const confirm = useConfirm();
  const controlled = open !== undefined;
  // 확인창이 떠 있는 동안 다시 묻지 않는다(개발 모드 effect 이중 실행 포함)
  const askingRef = useRef(false);

  const result = useMemo(() => (enabled ? analyzeCompetition(videos) : null), [videos, enabled]);

  async function requestStart() {
    if (askingRef.current) return;
    askingRef.current = true;
    const ok = await confirm(COMPETITION_CONFIRM);
    askingRef.current = false;
    if (ok) setEnabled(true);
    else if (controlled) onClose?.();
  }

  // 분석 도구 줄에서 처음 열면 옵트인 확인창부터
  useEffect(() => {
    if (controlled && open && !enabled && videos.length > 0) void requestStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, open, enabled, videos.length]);

  if (videos.length === 0) return null;
  if (controlled && !open) return null;

  // ─── 비활성 상태: 옵트인 버튼만 표시 (분석 도구 줄이 없는 곳에서만) ───
  if (!result) {
    if (controlled) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-body-sm font-medium text-fg-2">
            <span className="font-semibold text-fg-1">{query}</span> 키워드 경쟁도 분석
          </p>
          <p className="text-micro text-fg-3">사용자 자가 계산 도구 (YouTube 공식 메트릭 아님)</p>
        </div>
        <button
          type="button"
          onClick={() => void requestStart()}
          aria-haspopup="dialog"
          className={cx(buttonClass({ variant: "secondary", size: "sm" }), "px-3 pointer-coarse:h-11")}
        >
          경쟁도 분석 시작
        </button>
      </div>
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
    <section aria-label={`${query} 키워드 경쟁도`} className="space-y-2">
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex shrink-0 items-center gap-3">
              <span className={cx("tnum min-w-[2ch] text-right text-[26px] font-extrabold leading-none tracking-[-0.02em]", config.text)}>
                {result.score}
              </span>
              <span className="flex flex-col gap-1.5">
                <CompetitionMeter level={result.level} />
                <span className={cx("text-body-sm font-bold leading-none", config.text)}>경쟁 {result.level}</span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-body-sm font-medium text-fg-2">
                  <span className="font-semibold text-fg-1">{query}</span> 키워드 경쟁도
                </span>
                <span className="text-micro text-fg-3">사용자 자가 계산</span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-0.5">
                {metrics.map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5 text-caption">
                    <span className="text-fg-3">{m.label}</span>
                    <span className="tnum font-medium text-fg-1">{m.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-caption text-fg-2 lg:hidden">{config.recommendation}</p>
            </div>
            <p className="hidden max-w-[260px] shrink-0 text-caption text-fg-2 lg:block">{config.recommendation}</p>
          </div>
          {controlled && (
            <button
              type="button"
              onClick={onClose}
              aria-label="경쟁도 분석 닫기"
              className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      </div>
      <p className="px-1 text-micro text-fg-3">
        ※ 위 점수/등급/추천은 사용자가 직접 활성화한 자가 계산 결과입니다. YouTube 공식 메트릭이 아니며, bibl lab이 제공하는 평가가 아닙니다.
      </p>
    </section>
  );
}
