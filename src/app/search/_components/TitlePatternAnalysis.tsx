"use client";

import { useId, useState, useMemo } from "react";
import { Video } from "@/types";
import { badgeClass } from "@/components/ui/badge";
import { cx } from "@/components/ui/button";
import { ChevronDownIcon, CloseIcon, InfoIcon } from "@/components/ui/icons";

interface PatternDef {
  key: string;
  label: string;
  desc: string;
  example: string;
  test: (title: string) => boolean;
}

const PATTERN_DEFS: PatternDef[] = [
  {
    key: "number",
    label: "숫자형",
    desc: "숫자로 정보량을 명확히 제시해 신뢰감을 주는 제목",
    example: "골프 필수 연습법 7가지",
    test: (t) => /\d+\s*(가지|개|선|위|분|초|일|달|번|편|종류|방법)/.test(t),
  },
  {
    key: "question",
    label: "질문형",
    desc: "시청자의 궁금증을 자극해 클릭을 유도하는 제목",
    example: "왜 골퍼들은 이 드라이버만 쓸까?",
    test: (t) =>
      /[?]/.test(t) ||
      /(어떻게|왜|뭐|무엇|얼마나|몇|할까)/.test(t),
  },
  {
    key: "howto",
    label: "하우투형",
    desc: "방법·팁·노하우를 직접 알려주는 실용적 제목",
    example: "초보도 따라하는 골프 스윙 꿀팁",
    test: (t) =>
      /(방법|하는\s?법|꿀팁|팁|노하우|비법|비결|가이드)/.test(t),
  },
  {
    key: "provocative",
    label: "자극형",
    desc: "강한 감정 반응을 일으켜 클릭을 유도하는 제목",
    example: "이 골퍼 실화임? 역대급 드라이버 레전드",
    test: (t) =>
      /(충격|경악|실화|논란|ㄷㄷ|ㅋㅋ|ㄹㅇ|레전드|역대급|미쳤|대박|충격적|소름|헐)/.test(t),
  },
  {
    key: "comparison",
    label: "비교형",
    desc: "두 대상을 맞붙여 선택을 돕는 제목",
    example: "아이언 vs 유틸리티, 뭐가 나을까",
    test: (t) => /(vs|VS|비교|차이|대결)/.test(t),
  },
  {
    key: "review",
    label: "리뷰형",
    desc: "제품·장소의 솔직한 사용 경험을 담은 제목",
    example: "10만원대 골프공 한 달 사용 솔직 후기",
    test: (t) =>
      /(리뷰|후기|솔직|사용기|언박싱|개봉기)/.test(t),
  },
];

interface PatternStat {
  key: string;
  label: string;
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

/** 패턴 이름 태그(DESIGN 6.12 태그). 패턴마다 다른 색을 쓰지 않는다 */
const PATTERN_TAG = "inline-flex w-fit shrink-0 items-center rounded-md border border-line-strong px-2 py-0.5 text-micro font-medium text-fg-1";

export default function TitlePatternAnalysis({
  videos,
  open: openProp,
  onClose,
}: {
  videos: Video[];
  /** 분석 도구 줄(SearchResultList)이 여닫을 때 넘긴다. 넘기지 않으면 이 컴포넌트의 머리 버튼이 직접 여닫는다 */
  open?: boolean;
  onClose?: () => void;
}) {
  const controlled = openProp !== undefined;
  const titleId = useId();
  const [selfOpen, setOpen] = useState(false);
  const open = controlled ? openProp : selfOpen;

  const stats = useMemo(() => {
    const result: PatternStat[] = [];

    for (const def of PATTERN_DEFS) {
      const matched = videos.filter((v) => def.test(v.title));
      const totalViews = matched.reduce((s, v) => s + v.viewCount, 0);
      const goodCount = matched.filter((v) => v.score === "Good").length;

      result.push({
        key: def.key,
        label: def.label,
        count: matched.length,
        avgViews: matched.length > 0 ? Math.round(totalViews / matched.length) : 0,
        goodRatio: matched.length > 0 ? Math.round((goodCount / matched.length) * 100) : 0,
      });
    }
    return result;
  }, [videos]);

  const bestPattern = stats.find((s) => s.count > 0) ?? null;

  if (controlled && !open) return null;

  const basisTag = <span className={badgeClass()}>검색 결과 기준</span>;

  return (
    <section aria-labelledby={titleId} className="overflow-hidden rounded-card border border-line bg-surface">
      {controlled ? (
        <div className="flex items-center justify-between gap-3 py-2 pl-5 pr-3">
          <div className="flex items-center gap-2">
            <h3 id={titleId} className="text-body font-semibold text-fg">제목 패턴 분석</h3>
            {basisTag}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="제목 패턴 분석 닫기"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex min-h-14 w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-surface-2"
        >
          <span className="flex items-center gap-2">
            <span id={titleId} className="text-body font-semibold text-fg">제목 패턴 분석</span>
            {basisTag}
          </span>
          <ChevronDownIcon size={16} className={cx("text-fg-3 transition-transform", open && "rotate-180")} />
        </button>
      )}

      {open && (
        <div className="space-y-3 px-5 pb-5">
          {/* Header row */}
          <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_3.75rem_minmax(0,1.2fr)] gap-x-2.5 md:grid-cols-[minmax(0,1fr)_3rem_4.5rem_minmax(0,1fr)] md:gap-x-4 border-b border-line pb-2 text-micro text-fg-3">
            <span>패턴</span>
            <span className="text-right">영상 수</span>
            <span className="text-right">평균 조회수</span>
            <span
              className="inline-flex cursor-help flex-wrap items-center gap-1 underline decoration-fg-4 decoration-dotted"
              title="구독자 수 대비 조회수가 높고, 업로드 후 빠르게 조회수가 오른 영상을 Good으로 분류합니다"
            >
              반응 Good <span className="inline-flex items-center gap-1 whitespace-nowrap">비율 <InfoIcon size={16} /></span>
            </span>
          </div>

          {/* Pattern rows */}
          {stats.map((s) => {
            const def = PATTERN_DEFS.find((d) => d.key === s.key);
            return (
              <div
                key={s.key}
                className={cx("grid items-start grid-cols-[minmax(0,1fr)_2.5rem_3.75rem_minmax(0,1.2fr)] gap-x-2.5 md:grid-cols-[minmax(0,1fr)_3rem_4.5rem_minmax(0,1fr)] md:gap-x-4 transition-opacity", s.count === 0 && "opacity-40")}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={PATTERN_TAG}>{s.label}</span>
                    {s.count > 0 && s.count < 3 && (
                      <span className={badgeClass("warn")}>데이터 부족</span>
                    )}
                  </div>
                  {def && (
                    <span className="mt-1 text-micro leading-snug text-fg-3">
                      {def.desc}
                    </span>
                  )}
                </div>
                <span className="tnum pt-0.5 text-right text-body-sm text-fg-2">
                  {s.count}개
                </span>
                <span className="tnum pt-0.5 text-right text-body-sm text-fg-2">
                  {s.count > 0 ? formatViews(s.avgViews) : "-"}
                </span>
                <GoodRatioBar ratio={s.goodRatio} hasData={s.count >= 3} />
              </div>
            );
          })}

          {/* 기준 안내 */}
          <p className="pt-1 text-micro text-fg-3">
            ※ 반응 Good = 올린 직후 빠르게 퍼지고, 구독자 대비 조회수가 높은 영상 · 영상 3개 미만은 신뢰도가 낮습니다
          </p>

          {/* Best pattern callout */}
          {bestPattern && (
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
              <span className="text-caption text-fg-3">Best 패턴</span>
              <span className={PATTERN_TAG}>{bestPattern.label}</span>
              <span className="text-caption text-fg-2">
                평균 {formatViews(bestPattern.avgViews)} 조회
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── 등급 바 컴포넌트 ─────────────────────────────────────────────────────────

/** 반응 등급. 막대는 단색 chart-1, 등급 글자는 fg-2(평가에 흰 글자·여러 색을 쓰지 않는다) */
function getGrade(ratio: number): {
  grade: string;
  label: string;
} {
  if (ratio >= 80) return { grade: "S", label: "최상" };
  if (ratio >= 60) return { grade: "A", label: "좋음" };
  if (ratio >= 40) return { grade: "B", label: "보통" };
  if (ratio >= 20) return { grade: "C", label: "미흡" };
  return              { grade: "D", label: "낮음" };
}

function GoodRatioBar({ ratio, hasData }: { ratio: number; hasData: boolean }) {
  if (!hasData) {
    return (
      <div className="flex items-center gap-2 pt-1">
        <div className="h-1.5 flex-1 rounded-full bg-surface-3" />
        <span className="tnum w-9 text-right text-micro text-fg-3">-</span>
      </div>
    );
  }

  const { grade, label } = getGrade(ratio);

  return (
    <div className="flex flex-col gap-1 pt-1">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-chart-1 transition-all"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <span className="tnum w-9 text-right text-micro text-fg-2">{ratio}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md border border-line-strong px-1.5 text-micro font-bold leading-[18px] text-fg-2">
          {grade}
        </span>
        <span className="text-micro text-fg-3">{label}</span>
      </div>
    </div>
  );
}
