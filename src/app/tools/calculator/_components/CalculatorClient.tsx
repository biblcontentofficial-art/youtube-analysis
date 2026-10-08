"use client";

import { useState } from "react";
import { fetchVideoDetail, fetchChannelDetail } from "@/app/search/actions";
import { buttonClass, cx } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { CloseIcon, WarningIcon } from "@/components/ui/icons";

/**
 * 유튜브 비율 계산기 — 사용자 자가 도구
 *
 * YouTube ToS III.E.4h 준수 설계:
 * - 사용자가 명시적으로 URL 입력 + 계산 버튼 클릭해야만 동작
 * - bibl lab 서버는 YouTube API의 raw 데이터만 그대로 전달
 * - 모든 비율 계산은 클라이언트(브라우저)에서 단순 산술로 수행
 * - 결과에는 항상 "사용자 자가 계산, YouTube 공식 메트릭 아님" 디스클레이머 표시
 */

interface RawData {
  videoId: string;
  videoTitle: string;
  videoViews: number;
  videoLikes: number;
  channelTitle: string;
  channelSubscribers: number;
  channelTotalViews: number;
  channelVideoCount: number;
  channelAvgViews: number;
}

interface CalcResult {
  label: string;
  value: string;
  formula: string;
  note?: string;
}

// YouTube URL에서 videoId 추출
function extractVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // 그냥 ID만 입력
  ];
  for (const p of patterns) {
    const m = url.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

/** 앱 카드(DESIGN 6.7) */
const CARD = "rounded-card border border-line bg-surface p-5 md:p-6";
/** 단계 제목: 글자 숫자 01·02(실버) + 제목 */
const STEP = "mb-3 flex items-baseline gap-2.5 text-body-sm font-semibold text-fg";
const STEP_NUM = "tnum font-bold text-silver";
/** 계산 버튼: 보조 버튼 한 모양(두 줄) */
const CALC_BTN =
  "flex min-h-11 flex-col items-start rounded-control border border-line-strong bg-surface px-4 py-3 text-left text-body-sm font-semibold text-fg transition-colors duration-150 hover:border-line-hover hover:bg-surface-2";
const CALC_BTN_SUB = "mt-0.5 text-micro font-normal text-fg-3";
/** 글자 버튼(초기화·모두 지우기) */
const TEXT_BTN =
  "-mr-2 inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-control px-2 text-caption font-medium text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg";

export default function CalculatorClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RawData | null>(null);
  const [results, setResults] = useState<CalcResult[]>([]);

  // ─── 1단계: URL → raw 데이터 가져오기 (사용자 클릭 시) ───
  async function handleFetch() {
    setError(null);
    setData(null);
    setResults([]);

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("올바른 YouTube 영상 URL이 아닙니다. 예: https://youtu.be/abc123XYZ12");
      return;
    }

    setLoading(true);
    try {
      // 서버에서 raw 데이터만 받아옴 (어떤 계산도 안 함)
      const detail = await fetchVideoDetail(videoId);
      if (!detail) {
        setError("영상 정보를 가져올 수 없습니다. 비공개/삭제된 영상이거나 잘못된 ID일 수 있습니다.");
        return;
      }

      const channel = await fetchChannelDetail(detail.channelId);
      if (!channel) {
        setError("채널 정보를 가져올 수 없습니다.");
        return;
      }

      // 캐시된 search 결과가 없으므로 채널명/제목은 다른 경로로 가져와야 하지만,
      // 일단 description의 첫 줄을 제목 대용으로 사용하지 않고, videoId를 표시
      const avgViews = channel.videoCount > 0 ? Math.round(channel.viewCount / channel.videoCount) : 0;

      setData({
        videoId,
        videoTitle: detail.description?.split("\n")[0]?.slice(0, 80) || videoId,
        videoViews: detail.rawViewCount,
        videoLikes: detail.rawLikeCount,
        channelTitle: channel.title ?? "(채널명 없음)",
        channelSubscribers: channel.subscriberCount,
        channelTotalViews: channel.viewCount,
        channelVideoCount: channel.videoCount,
        channelAvgViews: avgViews,
      });
    } catch (e) {
      console.error(e);
      setError("데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // ─── 2단계: 사용자가 원하는 계산 버튼 클릭 시 클라이언트 계산 ───
  function calc(type: "ratio_avg" | "ratio_sub" | "engagement" | "like_ratio") {
    if (!data) return;
    const list: CalcResult[] = [];

    if (type === "ratio_avg") {
      if (!data.channelAvgViews) {
        list.push({ label: "계산 불가", value: "-", formula: "채널 평균 조회수가 0입니다." });
      } else {
        const r = data.videoViews / data.channelAvgViews;
        const pct = ((data.videoViews - data.channelAvgViews) / data.channelAvgViews) * 100;
        list.push({
          label: "채널 평균 조회수 대비 비율",
          value: `${r.toFixed(2)}x  (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`,
          formula: `${data.videoViews.toLocaleString()} ÷ ${data.channelAvgViews.toLocaleString()}`,
        });
      }
    }

    if (type === "ratio_sub") {
      if (!data.channelSubscribers) {
        list.push({ label: "계산 불가", value: "-", formula: "구독자 수가 0입니다." });
      } else {
        const r = data.videoViews / data.channelSubscribers;
        list.push({
          label: "구독자 대비 조회수 비율",
          value: `${r.toFixed(2)}x`,
          formula: `${data.videoViews.toLocaleString()} ÷ ${data.channelSubscribers.toLocaleString()}`,
          note: "1.0x = 구독자 수와 같은 조회수",
        });
      }
    }

    if (type === "engagement") {
      if (!data.videoViews) {
        list.push({ label: "계산 불가", value: "-", formula: "조회수가 0입니다." });
      } else {
        const r = (data.videoLikes / data.videoViews) * 100;
        list.push({
          label: "참여율 (Like / View)",
          value: `${r.toFixed(2)}%`,
          formula: `(${data.videoLikes.toLocaleString()} ÷ ${data.videoViews.toLocaleString()}) × 100`,
          note: "업계 평균: 약 1~4%",
        });
      }
    }

    if (type === "like_ratio") {
      if (!data.channelSubscribers) {
        list.push({ label: "계산 불가", value: "-", formula: "구독자 수가 0입니다." });
      } else {
        const r = data.videoLikes / data.channelSubscribers;
        list.push({
          label: "구독자 대비 좋아요 비율",
          value: `${(r * 100).toFixed(2)}%`,
          formula: `${data.videoLikes.toLocaleString()} ÷ ${data.channelSubscribers.toLocaleString()}`,
        });
      }
    }

    // 같은 종류 결과는 최신 것만 보여줌
    setResults((prev) => [...prev.filter((p) => p.label !== list[0].label), ...list]);
  }

  function resetAll() {
    setData(null);
    setResults([]);
    setError(null);
    setUrl("");
  }

  return (
    <div className="space-y-6">
      {/* ─── URL 입력 + 가져오기 버튼 ─── */}
      <div className={CARD}>
        <label htmlFor="calc-url" className={STEP}>
          <span className={STEP_NUM}>01</span> 영상 URL 입력
        </label>
        {/* 640 미만: 오른쪽 48px 를 비워 입력칸·버튼이 카카오 버튼 자리(오른쪽 76px)에 들어가지 않게 한다(DESIGN 6.17) */}
        <div className="flex flex-col gap-2 pr-12 sm:flex-row sm:pr-0">
          <input
            id="calc-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/xxxxxxxxxxx 또는 https://youtube.com/watch?v=xxxxxxxxxxx"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "calc-url-error" : undefined}
            className={cx(inputClass({ inset: true }), "min-w-0 sm:flex-1")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleFetch();
            }}
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={loading || !url.trim()}
            aria-busy={loading || undefined}
            className={cx(buttonClass({ variant: "primary", size: "md" }), "self-start sm:self-auto")}
          >
            {loading ? (
              <>
                <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-accent-ink border-t-transparent motion-reduce:animate-none" />
                가져오는 중...
              </>
            ) : (
              "데이터 가져오기"
            )}
          </button>
        </div>

        {error && (
          <p id="calc-url-error" role="alert" className="mt-2 flex gap-1.5 text-body-sm text-negative">
            <WarningIcon size={16} className="mt-[3px]" />
            <span>{error}</span>
          </p>
        )}
      </div>

      {/* ─── Raw 데이터 표시 (가져온 후) ─── */}
      {data && (
        <div className={CARD}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-caption text-fg-3">YouTube API 원본 데이터</p>
              <p className="line-clamp-1 text-ui font-medium text-fg-1">{data.videoTitle}</p>
              <p className="mt-0.5 text-caption text-fg-3">채널: {data.channelTitle}</p>
            </div>
            <button type="button" onClick={resetAll} className={TEXT_BTN}>
              초기화 <CloseIcon size={16} />
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-control bg-surface-2 p-3">
              <dt className="mb-1 text-caption text-fg-3">영상 조회수</dt>
              <dd className="tnum text-ui font-bold text-fg">{data.videoViews.toLocaleString()}</dd>
            </div>
            <div className="rounded-control bg-surface-2 p-3">
              <dt className="mb-1 text-caption text-fg-3">영상 좋아요</dt>
              <dd className="tnum text-ui font-bold text-fg">{data.videoLikes.toLocaleString()}</dd>
            </div>
            <div className="rounded-control bg-surface-2 p-3">
              <dt className="mb-1 text-caption text-fg-3">채널 구독자</dt>
              <dd className="tnum text-ui font-bold text-fg">{data.channelSubscribers.toLocaleString()}</dd>
            </div>
            <div className="rounded-control bg-surface-2 p-3">
              <dt className="mb-1 text-caption text-fg-3">채널 평균 조회수</dt>
              <dd className="tnum text-ui font-bold text-fg">{data.channelAvgViews.toLocaleString()}</dd>
            </div>
          </dl>
          <p className="mt-3 text-micro text-fg-3">
            ※ 위 숫자는 YouTube API가 반환한 그대로의 값입니다. 채널 평균은 (채널 총 조회수 ÷ 총 영상 수) 단순 산술입니다.
          </p>
        </div>
      )}

      {/* ─── 계산 도구 버튼 (사용자가 누를 때만 작동) ─── */}
      {data && (
        <fieldset className={CARD}>
          {/* 테두리 있는 fieldset 위에 legend 가 걸리지 않게 float 로 흐름 안에 둔다 */}
          <legend className={cx(STEP, "float-left w-full")}>
            <span className={STEP_NUM}>02</span> 원하는 계산 버튼 클릭 (사용자가 직접 실행)
          </legend>
          <div className="clear-both grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => calc("ratio_avg")} className={CALC_BTN}>
              채널 평균 조회수 대비 비율
              <span className={CALC_BTN_SUB}>영상 조회수 ÷ 채널 평균 조회수</span>
            </button>
            <button type="button" onClick={() => calc("ratio_sub")} className={CALC_BTN}>
              구독자 대비 조회수 비율
              <span className={CALC_BTN_SUB}>영상 조회수 ÷ 채널 구독자</span>
            </button>
            <button type="button" onClick={() => calc("engagement")} className={CALC_BTN}>
              참여율 (Like / View)
              <span className={CALC_BTN_SUB}>(좋아요 ÷ 조회수) × 100%</span>
            </button>
            <button type="button" onClick={() => calc("like_ratio")} className={CALC_BTN}>
              구독자 대비 좋아요 비율
              <span className={CALC_BTN_SUB}>좋아요 ÷ 채널 구독자</span>
            </button>
          </div>
        </fieldset>
      )}

      {/* ─── 결과 표시 (사용자 클릭 후에만 나타남). 알림 영역은 늘 두고 안쪽만 바꾼다 ─── */}
      <div aria-live="polite">
        {results.length > 0 && (
          <div className="rounded-card border border-line bg-surface-2 p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-ui font-semibold text-fg">사용자 자가 계산 결과</h3>
                <p className="mt-0.5 text-micro text-fg-3">
                  ※ 사용자가 직접 실행한 단순 산술 결과입니다. YouTube 공식 메트릭이 아니며, bibl lab의 평가/등급이 아닙니다.
                </p>
              </div>
              <button type="button" onClick={() => setResults([])} className={cx(TEXT_BTN, "hover:bg-surface-3")}>
                모두 지우기 <CloseIcon size={16} />
              </button>
            </div>

            <ul className="divide-y divide-line border-t border-line">
              {results.map((r, i) => (
                <li key={i} className="py-4">
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                    <div className="text-body-sm font-medium text-fg-2">{r.label}</div>
                    <div className="tnum text-h4 font-extrabold text-fg">{r.value}</div>
                  </div>
                  <div className="tnum mt-1 text-caption text-fg-3">계산식: {r.formula}</div>
                  {r.note && <div className="mt-1 text-micro text-fg-3">{r.note}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
