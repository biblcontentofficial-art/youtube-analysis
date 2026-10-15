"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 썸네일 원본 URL(VideoCard 와 같은 이유) */
/**
 * B6 썸네일 비교 보드. 근거: docs/trend-dev/spec.md 2.3·3.6 · DESIGN.md 6.5·6.6·6.12·6.13·6.29 · roadmap T8
 *
 *   <ThumbnailBoard query={query} videos={videos} open={tool === "thumbs"} onClose={closeTool} />
 *
 * - 격자는 지금 결과만으로 그린다(새 검색·API 호출 없음, Free 도 횟수 차감 없음). 길이 세그먼트 전체·롱폼·쇼츠, 조회수 순 상위 16.
 *   칸은 key={t.id}(SearchResultList 의 key={video.videoId} 개수는 불변 조건 검사 대상이라 이 파일에 둔다).
 * - '공통점 정리'(보조 버튼)만 POST /api/ai/thumbs 를 부른다. 남은 횟수는 처음 펼칠 때 GET /api/ai/usage(thumbs).
 *   브라우저에 로그인 세션이 없으면 usage 를 부르지 않고 로그인 안내를 보인다.
 *   available false → AiLockedButton('AI 기능 준비 중'), limit 0(Free) → 잠김 버튼(누르면 요금제), 0회 → disabled + 다시 쓸 수 있는 시각.
 * - 요청 중: 버튼 안 스피너(size-4) + 버튼의 aria-busy + disabled + '보통 20~30초 걸려요'. 두 번 눌러 2회 차감되지 않게.
 * - 결과: 공통점·적용해 볼 점 + 칸 아래 태그('얼굴'·'글자 n자', 격자 위 캡션으로 AI 추정임을 알림, title 툴팁 안 씀)
 *   + AiNotice + 판단 안내 한 줄. 실패는 charged 로 AiTemporaryError / AiChargedError.
 * - 닫혀 있어도 부모가 계속 그려 두면 결과·남은 횟수를 그대로 둔다(open false 면 아무것도 그리지 않음).
 * - preview 를 넘기면 네트워크를 쓰지 않고 그 상태를 그린다(로컬 고정 화면 /ux-preview/trend-thumbs).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { SEGMENT, SEGMENT_ITEM } from "@/components/ui/chip";
import { CloseIcon } from "@/components/ui/icons";
import { AiChargedError, AiLockedButton, AiNotice, AiTemporaryError } from "@/components/ui/notice";
import { formatCompactKo } from "@/lib/format";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { retryCaption } from "@/lib/trend/remix-schema";
import { THUMBS_LIMITS, pickTop, thumbTags, type ThumbItem, type ThumbsFormat, type ThumbsResult } from "@/lib/trend/thumbs-schema";
import { BTN_SECONDARY } from "./SelectionBar";

/** 격자에 쓰는 영상 값(Video 의 일부) */
export type ThumbBoardVideo = { videoId: string; title: string; viewCount: number; thumbnail: string; durationSeconds?: number };

export type ThumbsUsage = { used: number; limit: number; available: boolean };

/** 받은 결과와 그때 보낸 썸네일 순서·길이 */
export type ThumbsAnalysis = { data: ThumbsResult; videoIds: string[]; format: ThumbsFormat };

/** 로컬 고정 화면용 상태. 넘기면 fetch 를 하지 않는다 */
export type ThumbsPreview = {
  usage: ThumbsUsage | "unauth" | "loading";
  format?: ThumbsFormat;
  busy?: boolean;
  result?: ThumbsAnalysis | null;
  error?: "temp" | "charged" | null;
  /** 다시 쓸 수 있는 시각 계산 기준(ms) */
  now?: number;
};

type UsageState = ThumbsUsage | "idle" | "loading" | "error" | "unauth";

/** Pro(하루 20회) 미만이면 0회일 때 '요금제 보기 →'. usage API 가 플랜 이름을 주지 않아 한도로 판단한다(RemixDialog 와 같음) */
const PRO_DAILY_LIMIT = 20;

const FORMATS: { key: ThumbsFormat; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "long", label: "롱폼" },
  { key: "shorts", label: "쇼츠" },
];

const SUBTITLE = "text-caption font-semibold text-fg-3";
const NOTE = "mt-1.5 text-micro text-fg-3";
const TEXT_LINK = "inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors hover:text-fg-2";
const SPINNER = "size-4 animate-spin rounded-full border-2 border-line-hover border-t-fg";
const ACTION_BUTTON = cx(BTN_SECONDARY, "h-9 shrink-0 px-3.5 text-body-sm pointer-coarse:h-11");
/** 잠긴 동작: 보조 + 라벨 fg-3 + 요금제 태그(DESIGN 6.29, SearchResultList 의 잠금 버튼과 같은 모양) */
const LOCKED_BUTTON = cx(BTN_SECONDARY, "h-9 shrink-0 px-3 text-body-sm text-fg-3 hover:text-fg-3 pointer-coarse:h-11");
const PLAN_TAG = "inline-flex items-center rounded border border-line-strong px-1 text-micro font-medium leading-[18px] text-fg-3";

/** 브라우저 쿠키의 로그인 세션 유무(네트워크 없이). 확인 실패는 true(서버 응답을 따른다) */
async function hasBrowserSession(): Promise<boolean> {
  try {
    const { data } = await createSupabaseBrowser().auth.getSession();
    return !!data.session;
  } catch {
    return true;
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const j = await res.json();
    return j && typeof j === "object" ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default function ThumbnailBoard({
  query,
  videos,
  open = true,
  onClose,
  preview,
}: {
  query: string;
  videos: readonly ThumbBoardVideo[];
  /** 분석 도구 줄이 여닫는다. false 면 그리지 않는다(상태는 유지) */
  open?: boolean;
  onClose?: () => void;
  preview?: ThumbsPreview;
}) {
  const titleId = useId();
  const [format, setFormat] = useState<ThumbsFormat>(preview?.format ?? "all");
  const [usage, setUsage] = useState<UsageState>(preview ? preview.usage : "idle");
  const [busy, setBusy] = useState(!!preview?.busy);
  const [analysis, setAnalysis] = useState<ThumbsAnalysis | null>(preview?.result ?? null);
  const [error, setError] = useState<"temp" | "charged" | null>(preview?.error ?? null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // 처음 펼칠 때 한 번 남은 횟수를 읽는다(격자는 이 값과 상관없이 바로 그린다).
  // 브라우저에 로그인 세션이 없으면 usage 를 부르지 않고 바로 로그인 안내(401 콘솔 오류를 남기지 않음).
  // getSession 은 쿠키만 읽는다. 세션 확인이 실패하면 예전처럼 usage 를 불러 서버 응답(401 포함)을 따른다.
  useEffect(() => {
    if (preview || !open || usage !== "idle") return;
    setUsage("loading");
    hasBrowserSession()
      .then((signedIn) => {
        if (!mounted.current) return null;
        if (!signedIn) {
          setUsage("unauth");
          return null;
        }
        return fetch("/api/ai/usage", { cache: "no-store" });
      })
      .then(async (r) => {
        if (!r) return;
        if (!mounted.current) return;
        if (r.status === 401) return setUsage("unauth");
        if (!r.ok) return setUsage("error");
        const j = await readJson(r);
        if (!mounted.current) return;
        const t = j.thumbs as { used?: number; limit?: number } | undefined;
        setUsage({ used: Number(t?.used) || 0, limit: Number(t?.limit) || 0, available: j.available === true });
      })
      .catch(() => mounted.current && setUsage("error"));
  }, [preview, open, usage]);

  const items: ThumbItem[] = useMemo(
    () =>
      pickTop(videos, THUMBS_LIMITS.maxVideos, format).map((v) => ({
        id: v.videoId,
        title: v.title,
        viewCount: v.viewCount,
        thumbnail: v.thumbnail,
        durationSeconds: v.durationSeconds,
      })),
    [videos, format],
  );

  /** videoId → 칸 아래 태그(받은 결과의 번호 순서로 잇는다) */
  const tagsById = useMemo(() => {
    const m = new Map<string, string[]>();
    if (!analysis) return m;
    for (const p of analysis.data.per_thumb) {
      const id = analysis.videoIds[p.index - 1];
      if (id) m.set(id, thumbTags(p));
    }
    return m;
  }, [analysis]);

  const submit = useCallback(async () => {
    if (busy || preview || items.length === 0) return;
    const sent = items.map((t) => ({ videoId: t.id, title: t.title, viewCount: t.viewCount }));
    const sentFormat = format;
    setBusy(true);
    setError(null);
    let status = 0;
    let b: Record<string, unknown> = { charged: false };
    try {
      const r = await fetch("/api/ai/thumbs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, videos: sent }),
      });
      status = r.status;
      b = await readJson(r);
    } catch {
      status = 0;
    }
    if (!mounted.current) return;
    setBusy(false);
    const remaining = typeof b.remaining === "number" ? b.remaining : null;
    setUsage((u) => (typeof u === "object" && remaining !== null ? { ...u, used: Math.max(0, u.limit - remaining) } : u));
    if (status === 200 && b.data) {
      const videoIds = Array.isArray(b.videoIds) ? (b.videoIds as string[]) : sent.map((v) => v.videoId);
      setAnalysis({ data: b.data as ThumbsResult, videoIds, format: sentFormat });
      return;
    }
    if (status === 401) return setUsage("unauth");
    if (status === 429) {
      const used = Number(b.used) || 0;
      const limit = Number(b.limit) || 0;
      setUsage((u) => ({ used, limit, available: typeof u === "object" ? u.available : true }));
      return;
    }
    setError(b.charged === true ? "charged" : "temp");
  }, [busy, preview, items, format, query]);

  if (!open) return null;

  const now = preview?.now ?? Date.now();
  const u = typeof usage === "object" ? usage : null;
  const remaining = u ? Math.max(0, u.limit - u.used) : null;
  const locked = u ? !u.available : false;
  const noPlan = u ? u.limit <= 0 : false;
  const exhausted = u ? !noPlan && remaining === 0 : false;
  const disabled = busy || usage === "idle" || usage === "loading" || usage === "unauth" || exhausted || items.length === 0;
  const analyzedLabel = analysis ? `${FORMATS.find((f) => f.key === analysis.format)?.label ?? "전체"} ${analysis.videoIds.length}개 기준` : "";

  return (
    <section aria-labelledby={titleId} className="overflow-hidden rounded-card border border-line bg-surface">
      {/* 머리: 제목 · 길이 세그먼트(768 미만은 아래 줄) · 닫기 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 pl-5 pr-3">
        <h3 id={titleId} className="order-1 min-w-0 flex-1 text-ui font-semibold text-fg">
          ‘{query}’ 상위 영상 썸네일 <span className="tnum">{items.length}</span>개
        </h3>
        <div role="group" aria-label="영상 길이" className={cx(SEGMENT, "order-3 mb-2 w-full md:order-2 md:mb-0 md:w-auto")}>
          {FORMATS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={format === f.key}
              onClick={() => setFormat(f.key)}
              className={cx(SEGMENT_ITEM, "flex-1 md:flex-none")}
            >
              {f.label}
            </button>
          ))}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="썸네일 비교 닫기"
            className="order-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg md:order-3"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      <div className="px-5 pb-5">
        {analysis && <p className="mb-2 text-caption text-fg-3">칸 아래 태그는 AI 추정입니다.</p>}

        {items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {items.map((t) => {
              const tags = tagsById.get(t.id) ?? [];
              return (
                <li key={t.id} className="min-w-0">
                  {t.thumbnail ? (
                    <img
                      src={t.thumbnail}
                      alt={t.title}
                      width={320}
                      height={180}
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full rounded-control bg-surface-2 object-cover"
                    />
                  ) : (
                    <span role="img" aria-label={t.title} className="block aspect-video w-full rounded-control bg-surface-2" />
                  )}
                  <p className="tnum mt-1 text-micro text-fg-3">조회수 {formatCompactKo(t.viewCount)}회</p>
                  {tags.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span key={tag} className={cx(badgeClass(), "tnum")}>
                          {tag}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-control border border-line px-4 py-6 text-body-sm text-fg-3">이 길이의 영상이 지금 결과에 없습니다.</p>
        )}

        {/* 공통점 정리(AI) */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {locked ? (
              <AiLockedButton />
            ) : noPlan ? (
              <Link href="/pricing" title="Starter 플랜 이상에서 이용할 수 있습니다" className={LOCKED_BUTTON}>
                공통점 정리<span className={PLAN_TAG}>Starter</span>
              </Link>
            ) : (
              <button type="button" onClick={() => void submit()} disabled={disabled} aria-busy={busy || undefined} className={ACTION_BUTTON}>
                {busy && <span aria-hidden="true" className={SPINNER} />}
                {busy ? "공통점 정리 중" : "공통점 정리"}
              </button>
            )}
            {u && !locked && !noPlan && <p className="tnum text-caption text-fg-3">오늘 {remaining}회 남음</p>}
          </div>

          {busy && (
            <p role="status" className="mt-2 text-caption text-fg-3">
              보통 20~30초 걸려요
            </p>
          )}
          {!locked && exhausted && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <p className="text-caption text-negative">{retryCaption(now)}</p>
              {u && u.limit < PRO_DAILY_LIMIT && (
                <Link href="/pricing" className={TEXT_LINK}>
                  요금제 보기 <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          )}
          {usage === "unauth" && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <p className="text-caption text-fg-3">로그인하고 쓸 수 있어요.</p>
              <Link href="/sign-in" className={TEXT_LINK}>
                로그인 <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
          {error === "temp" && <AiTemporaryError className="mt-3" />}
          {error === "charged" && <AiChargedError className="mt-3" />}
        </div>

        {analysis && (
          <div className="mt-5 border-t border-line pt-5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h4 className={SUBTITLE}>공통점</h4>
              <span className="tnum text-caption text-fg-3">{analyzedLabel}</span>
            </div>
            <ul className="mt-2 divide-y divide-line-soft rounded-control border border-line">
              {analysis.data.common.map((c, i) => (
                <li key={i} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 px-3 py-2.5 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                  <span className="pt-0.5 text-caption font-semibold text-fg-3">{c.aspect}</span>
                  <p className="text-body-sm text-fg-2">
                    {c.finding}
                    {c.evidence && <span className="tnum ml-2 whitespace-nowrap text-caption text-fg-3">{c.evidence}</span>}
                  </p>
                </li>
              ))}
            </ul>

            <h4 className={cx(SUBTITLE, "mt-5")}>내 썸네일에 적용해 볼 점</h4>
            <ul className="mt-2 space-y-1.5 text-body-sm text-fg-2">
              {analysis.data.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="text-fg-3">·</span>
                  <span className="min-w-0">{t}</span>
                </li>
              ))}
            </ul>

            <AiNotice className="mt-4" />
            <p className={NOTE}>썸네일 판단은 이미지만 보고 추정한 값이라 틀릴 수 있습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
