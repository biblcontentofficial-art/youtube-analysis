"use client";

import { useState } from "react";
import type { ChannelAnalysis } from "../actions";
import { formatKstDate, kstWeekdayHour } from "@/lib/kst";
import { formatCompactKo } from "@/lib/format";
import { HEAT_LEVELS, heatLevel } from "@/lib/chartTheme";
import { TABLE, TH_PREVIEW, TH_SORT, TH_SORT_ACTIVE, TD, NUM, ROW } from "@/components/ui/table";
import { badgeClass } from "@/components/ui/badge";
import { cx } from "@/components/ui/button";

// 만·억 짧은 숫자(lib/format, 로캘 고정이라 서버·브라우저가 같은 글자를 낸다)
const formatNumber = formatCompactKo;

function formatDate(dateStr: string): string {
  // 한국 시간 날짜. 서버(UTC) 렌더와 브라우저 하이드레이션이 같은 값을 낸다.
  return formatKstDate(dateStr);
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_NAMES_LONG = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/** 평균이 가장 높은 칸(업로드가 있는 칸만, 같으면 앞 칸). 없으면 -1. */
function bestIndex(avgs: number[], counts: number[]): number {
  let best = -1;
  for (let i = 0; i < avgs.length; i++) {
    if (counts[i] > 0 && (best < 0 || avgs[i] > avgs[best])) best = i;
  }
  return best;
}

function averages(sums: number[], counts: number[]): number[] {
  return sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
}

/**
 * 업로드 요일·시간 분석: '최적 업로드 시간' 카드와 요일별 히트맵이 같이 쓴다.
 * 업로드 시각을 한국 시간(Asia/Seoul)으로 묶는다. 서버 액션 값(insights.bestDayOfWeek·bestHour)은
 * 서버 시간대(UTC)로 계산돼 9시간 어긋나므로 화면에 쓰지 않는다.
 * 최적 시간: 평균 조회수가 가장 높은 요일(히트맵에서 가장 진한 요일)을 고른 뒤, 그 요일에 올린 영상의
 * 업로드 시 가운데 평균이 가장 높은 시를 고른다. 요일과 시를 따로 골라 붙이지 않으므로
 * 카드에 나오는 요일·시각에는 늘 실제로 올린 영상이 있다.
 */
function analyzeUploadTiming(videos: ChannelAnalysis["recentVideos"]) {
  const dayCounts = Array<number>(7).fill(0);
  const daySums = Array<number>(7).fill(0);
  // 요일별 24칸(시): hourCounts[요일][시], hourSums[요일][시]
  const hourCounts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const hourSums = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  let sample = 0;
  for (const v of videos) {
    const t = kstWeekdayHour(v.publishedAt);
    if (!t) continue;
    sample++;
    dayCounts[t.weekday]++;
    daySums[t.weekday] += v.viewCount;
    hourCounts[t.weekday][t.hour]++;
    hourSums[t.weekday][t.hour] += v.viewCount;
  }
  const dayAvgs = averages(daySums, dayCounts);
  const bestDay = bestIndex(dayAvgs, dayCounts);
  // 고른 요일에는 업로드가 1편 이상 있으므로 시도 늘 하나 나온다.
  const bestHour =
    bestDay < 0 ? -1 : bestIndex(averages(hourSums[bestDay], hourCounts[bestDay]), hourCounts[bestDay]);
  return {
    sample,
    dayCounts,
    dayViewAvgs: dayAvgs.map((a) => Math.round(a)),
    best: bestDay < 0 || bestHour < 0 ? null : { weekday: bestDay, hour: bestHour },
  };
}

// 히트맵: 무채색 heat-1~5 단계(lib/chartTheme). 1·2단계 흰 글자, 3단계부터 검정 글자(모두 4.5:1 이상).
const CARD = "rounded-card border border-line bg-surface";

type SortKey = "viewCount" | "likeCount" | "commentCount" | "publishedAt";

export default function ChannelDashboard({ data }: { data: ChannelAnalysis }) {
  const { channel, recentVideos, insights } = data;
  const [sortKey, setSortKey] = useState<SortKey>("viewCount");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedVideos = [...recentVideos].sort((a, b) => {
    let aVal: number, bVal: number;
    if (sortKey === "publishedAt") {
      aVal = new Date(a.publishedAt).getTime();
      bVal = new Date(b.publishedAt).getTime();
    } else {
      aVal = a[sortKey];
      bVal = b[sortKey];
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const trendLabel =
    insights.viewTrend === "growing"
      ? "상승세"
      : insights.viewTrend === "declining"
        ? "하락세"
        : "안정적";

  // 상승 positive ▲ · 하락 negative ▼ · 안정 무채색 (색만으로 말하지 않는다)
  const trendColor =
    insights.viewTrend === "growing"
      ? "text-positive"
      : insights.viewTrend === "declining"
        ? "text-negative"
        : "text-fg-2";
  const trendSymbol =
    insights.viewTrend === "growing" ? "▲ " : insights.viewTrend === "declining" ? "▼ " : "";

  const trendArrow =
    insights.viewTrend === "growing"
      ? "+"
      : insights.viewTrend === "declining"
        ? ""
        : "";

  // 업로드 요일·시간 (한국 시간): 최적 업로드 시간 카드 + 요일별 히트맵
  const timing = analyzeUploadTiming(recentVideos);
  const dayNames = DAY_NAMES;
  const dayUploadCounts = timing.dayCounts;
  const dayViewAvgs = timing.dayViewAvgs;
  const maxDayAvg = Math.max(...dayViewAvgs, 1);
  const bestUploadTime = timing.best
    ? `${DAY_NAMES_LONG[timing.best.weekday]} ${timing.best.hour}시`
    : "-";

  // 정렬 머리: button + aria-sort (DESIGN 6.10)
  const sortHead = (key: SortKey, label: string, extra = "") => {
    const active = sortKey === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sortAsc ? "ascending" : "descending") : undefined}
        className={cx(TH_PREVIEW, "py-0.5 text-right", extra)}
      >
        <button type="button" onClick={() => handleSort(key)} className={cx(TH_SORT, active && TH_SORT_ACTIVE)}>
          {label}
          {active && <span aria-hidden="true">{sortAsc ? "\u2191" : "\u2193"}</span>}
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-8">
      {/* Channel Profile Card */}
      <section aria-labelledby="channel-profile-title" className={cx(CARD, "p-5 md:p-6")}>
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt=""
              className="size-20 shrink-0 rounded-full bg-surface-2 object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 id="channel-profile-title" className="truncate text-h4 font-extrabold text-fg">{channel.title}</h2>
            {channel.description && (
              <p className="mt-1 line-clamp-2 text-body-sm text-fg-3">{channel.description}</p>
            )}
            <dl className="tnum mt-3 flex flex-wrap gap-x-5 gap-y-1 text-body-sm">
              <div className="flex gap-1.5">
                <dt className="text-fg-3">구독자</dt>
                <dd className="font-semibold text-fg">{formatNumber(channel.subscriberCount)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-fg-3">총 조회수</dt>
                <dd className="font-semibold text-fg">{formatNumber(channel.viewCount)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-fg-3">영상 수</dt>
                <dd className="font-semibold text-fg">{formatNumber(channel.videoCount)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-fg-3">개설일</dt>
                <dd className="font-semibold text-fg">{formatDate(channel.createdAt)}</dd>
              </div>
            </dl>
            {channel.keywords.length > 0 && (
              <ul aria-label="채널 키워드" className="mt-3 flex flex-wrap gap-1.5">
                {channel.keywords.slice(0, 10).map((kw, i) => (
                  <li key={i} className={badgeClass()}>
                    {kw}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Insights Grid */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightCard
          label="평균 조회수"
          value={formatNumber(insights.avgViews)}
          sub={`중간값 ${formatNumber(insights.medianViews)}`}
        />
        <InsightCard
          label="업로드 주기"
          value={`${insights.uploadFrequencyDays}일`}
          sub="영상 간 평균 간격"
        />
        <InsightCard
          label="최적 업로드 시간"
          value={bestUploadTime}
          sub={`최근 ${timing.sample}개 영상 기준`}
        />
        <InsightCard
          label="조회수 추이"
          value={`${trendSymbol}${trendLabel}`}
          valueColor={trendColor}
          sub={`최근 영상 대비 ${trendArrow}${insights.viewTrendPercent}%`}
        />
      </dl>

      {/* Best Performing Video */}
      {insights.bestVideo.videoId && (
        <section aria-labelledby="best-video-title" className={cx(CARD, "p-5 md:p-6")}>
          <h3 id="best-video-title" className="mb-3 text-body font-bold text-fg">
            최고 성과 영상 (최근 30개 중)
          </h3>
          <div className="flex items-start gap-4">
            <a
              href={`https://www.youtube.com/watch?v=${insights.bestVideo.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              aria-hidden="true"
              className="shrink-0"
            >
              <img
                src={`https://i.ytimg.com/vi/${insights.bestVideo.videoId}/mqdefault.jpg`}
                alt=""
                className="h-auto w-32 rounded-control bg-surface-2 sm:w-40"
              />
            </a>
            <div className="min-w-0">
              <a
                href={`https://www.youtube.com/watch?v=${insights.bestVideo.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 text-ui font-semibold text-fg underline decoration-fg-4 underline-offset-2 transition-colors hover:decoration-fg"
              >
                {insights.bestVideo.title}
                <span className="sr-only"> (새 창)</span>
              </a>
              <p className="tnum mt-1 text-body-sm text-fg-3">
                조회수 {formatNumber(insights.bestVideo.viewCount)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Upload Timing Heatmap */}
      <section aria-labelledby="heatmap-title" className={cx(CARD, "p-5 md:p-6")}>
        <h3 id="heatmap-title" className="mb-4 text-body font-bold text-fg">요일별 업로드 분석</h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {dayNames.map((name, i) => {
            const level = maxDayAvg > 0 && dayUploadCounts[i] > 0 ? heatLevel(dayViewAvgs[i] / maxDayAvg) : 0;
            return (
              <div key={i} className="text-center">
                <div className="mb-2 text-caption text-fg-3">{name}</div>
                <div
                  data-heat={level + 1}
                  className={cx(
                    "tnum mx-auto flex size-10 items-center justify-center rounded-control text-caption font-semibold",
                    HEAT_LEVELS[level],
                  )}
                >
                  {dayUploadCounts[i]}
                </div>
                <div className="tnum mt-1 text-micro text-fg-3">
                  {dayViewAvgs[i] > 0 ? formatNumber(dayViewAvgs[i]) : "-"}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-micro text-fg-3">
          <p>숫자 = 업로드 횟수 / 하단 = 평균 조회수 / 칸이 밝을수록 조회수 높음</p>
          {/* 범례: 어두움(적음) → 밝음(많음) */}
          <p className="flex items-center gap-1.5" aria-hidden="true">
            <span>낮음</span>
            {HEAT_LEVELS.map((c, i) => (
              <span key={i} className={cx("inline-block size-3 rounded-[3px] border border-line", c)} />
            ))}
            <span>높음</span>
          </p>
        </div>
      </section>

      {/* Recent Videos Table */}
      {sortedVideos.length > 0 && (
        <section aria-labelledby="recent-videos-title">
          <h3 id="recent-videos-title" className="mb-3 text-body font-bold text-fg">
            최근 영상 <span className="tnum text-caption font-normal text-fg-3">{recentVideos.length}개</span>
          </h3>
          {/* 좁은 화면은 상자 안 가로 스크롤(페이지는 넘치지 않음) */}
          <div className="overflow-x-auto">
            <table className={cx(TABLE, "min-w-[560px]")}>
              <thead>
                <tr>
                  <th scope="col" className={cx(TH_PREVIEW, "py-0.5")}>영상</th>
                  {sortHead("viewCount", "조회수", "w-24")}
                  {sortHead("likeCount", "좋아요", "w-20")}
                  {sortHead("commentCount", "댓글", "w-20")}
                  {sortHead("publishedAt", "업로드일", "w-28")}
                </tr>
              </thead>
              <tbody>
                {sortedVideos.map((video) => (
                  <tr key={video.videoId} className={ROW}>
                    <td className={cx(TD, "pr-4")}>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="-my-2.5 line-clamp-1 py-2.5 text-body-sm font-medium text-fg-1 transition-colors hover:text-fg-2"
                        title={video.title}
                      >
                        {video.title}
                      </a>
                    </td>
                    <td className={cx(TD, NUM, "text-body-sm font-semibold text-fg")}>
                      {formatNumber(video.viewCount)}
                    </td>
                    <td className={cx(TD, NUM, "text-body-sm text-fg-2")}>
                      {formatNumber(video.likeCount)}
                    </td>
                    <td className={cx(TD, NUM, "text-body-sm text-fg-2")}>
                      {formatNumber(video.commentCount)}
                    </td>
                    <td className={cx(TD, NUM, "whitespace-nowrap text-body-sm text-fg-3")}>
                      {formatDate(video.publishedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function InsightCard({
  label,
  value,
  sub,
  valueColor = "text-fg",
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className={cx(CARD, "p-4 md:p-5")}>
      <dt className="mb-1 text-caption text-fg-3">{label}</dt>
      <dd className={cx("tnum text-h4 font-extrabold", valueColor)}>{value}</dd>
      <dd className="tnum mt-1 text-micro text-fg-3">{sub}</dd>
    </div>
  );
}
