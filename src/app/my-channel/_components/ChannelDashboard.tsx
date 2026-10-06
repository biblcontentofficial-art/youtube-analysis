"use client";

import { useState } from "react";
import type { ChannelAnalysis } from "../actions";
import { formatKstDate, kstWeekdayHour } from "@/lib/kst";

function formatNumber(num: number): string {
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}천`;
  // 로캘을 고정해 서버(en-US)와 브라우저가 같은 글자를 낸다(하이드레이션).
  return num.toLocaleString("ko-KR");
}

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

// 히트맵 칸 글자색: 에메랄드가 이 불투명도 이상이면 검정, 미만이면 흰색.
// neutral-900 카드 위에서 양쪽 모두 대비 4.5:1 이상이 되는 경계(검정 4.62 · 흰색 4.56)다.
const HEAT_DARK_TEXT_FROM = 0.54;

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

  const trendColor =
    insights.viewTrend === "growing"
      ? "text-green-400"
      : insights.viewTrend === "declining"
        ? "text-red-400"
        : "text-neutral-400";

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

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1 text-white">
        {sortAsc ? "\u2191" : "\u2193"}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Channel Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-20 h-20 rounded-full border-2 border-neutral-700 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{channel.title}</h2>
            {channel.description && (
              <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{channel.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div>
                <span className="text-neutral-500">구독자</span>{" "}
                <span className="text-white font-semibold">{formatNumber(channel.subscriberCount)}</span>
              </div>
              <div>
                <span className="text-neutral-500">총 조회수</span>{" "}
                <span className="text-white font-semibold">{formatNumber(channel.viewCount)}</span>
              </div>
              <div>
                <span className="text-neutral-500">영상 수</span>{" "}
                <span className="text-white font-semibold">{formatNumber(channel.videoCount)}</span>
              </div>
              <div>
                <span className="text-neutral-500">개설일</span>{" "}
                <span className="text-white font-semibold">{formatDate(channel.createdAt)}</span>
              </div>
            </div>
            {channel.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {channel.keywords.slice(0, 10).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          value={trendLabel}
          valueColor={trendColor}
          sub={`최근 영상 대비 ${trendArrow}${insights.viewTrendPercent}%`}
        />
      </div>

      {/* Best Performing Video */}
      {insights.bestVideo.videoId && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-neutral-400 mb-3">
            최고 성과 영상 (최근 30개 중)
          </h3>
          <div className="flex items-start gap-4">
            <a
              href={`https://www.youtube.com/watch?v=${insights.bestVideo.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <img
                src={`https://i.ytimg.com/vi/${insights.bestVideo.videoId}/mqdefault.jpg`}
                alt={insights.bestVideo.title}
                className="w-40 h-auto rounded-lg border border-neutral-700 hover:border-neutral-500 transition"
              />
            </a>
            <div className="min-w-0">
              <a
                href={`https://www.youtube.com/watch?v=${insights.bestVideo.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-neutral-300 transition line-clamp-2"
              >
                {insights.bestVideo.title}
              </a>
              <p className="text-sm text-neutral-500 mt-1">
                조회수 {formatNumber(insights.bestVideo.viewCount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Timing Heatmap */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-neutral-400 mb-4">요일별 업로드 분석</h3>
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((name, i) => {
            const intensity = maxDayAvg > 0 ? dayViewAvgs[i] / maxDayAvg : 0;
            const bgOpacity = Math.max(0.1, intensity);
            return (
              <div key={i} className="text-center">
                <div className="text-xs text-neutral-500 mb-2">{name}</div>
                <div
                  className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold border border-neutral-700"
                  style={{
                    backgroundColor: `rgba(0, 229, 160, ${bgOpacity})`,
                    color: bgOpacity >= HEAT_DARK_TEXT_FROM ? "#000000" : "#ffffff",
                  }}
                >
                  {dayUploadCounts[i]}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  {dayViewAvgs[i] > 0 ? formatNumber(dayViewAvgs[i]) : "-"}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-neutral-500 mt-3">
          숫자 = 업로드 횟수 / 하단 = 평균 조회수 / 색상 진할수록 조회수 높음
        </p>
      </div>

      {/* Recent Videos Table */}
      {sortedVideos.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-400">
              최근 영상 ({recentVideos.length}개)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-xs">
                  <th className="text-left px-5 py-3 font-medium">영상</th>
                  <th
                    className="text-right px-3 py-3 font-medium cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleSort("viewCount")}
                  >
                    조회수{sortIndicator("viewCount")}
                  </th>
                  <th
                    className="text-right px-3 py-3 font-medium cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleSort("likeCount")}
                  >
                    좋아요{sortIndicator("likeCount")}
                  </th>
                  <th
                    className="text-right px-3 py-3 font-medium cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleSort("commentCount")}
                  >
                    댓글{sortIndicator("commentCount")}
                  </th>
                  <th
                    className="text-right px-5 py-3 font-medium cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleSort("publishedAt")}
                  >
                    업로드일{sortIndicator("publishedAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVideos.map((video) => (
                  <tr
                    key={video.videoId}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition"
                  >
                    <td className="px-5 py-3 max-w-xs">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-neutral-300 transition line-clamp-1"
                        title={video.title}
                      >
                        {video.title}
                      </a>
                    </td>
                    <td className="text-right px-3 py-3 text-neutral-300 tabular-nums">
                      {formatNumber(video.viewCount)}
                    </td>
                    <td className="text-right px-3 py-3 text-neutral-400 tabular-nums">
                      {formatNumber(video.likeCount)}
                    </td>
                    <td className="text-right px-3 py-3 text-neutral-400 tabular-nums">
                      {formatNumber(video.commentCount)}
                    </td>
                    <td className="text-right px-5 py-3 text-neutral-500 tabular-nums whitespace-nowrap">
                      {formatDate(video.publishedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  label,
  value,
  sub,
  valueColor = "text-white",
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-neutral-500 mt-1">{sub}</p>
    </div>
  );
}
