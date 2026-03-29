"use client";

import { useState } from "react";
import type { ChannelAnalysis } from "../actions";

function formatNumber(num: number): string {
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}천`;
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

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
        : "text-gray-400";

  const trendArrow =
    insights.viewTrend === "growing"
      ? "+"
      : insights.viewTrend === "declining"
        ? ""
        : "";

  // Upload timing heatmap data (day of week)
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayUploadCounts = new Array(7).fill(0);
  const dayViewAvgs = new Array(7).fill(0);
  const dayViewSums = new Array(7).fill(0);
  for (const v of recentVideos) {
    const day = new Date(v.publishedAt).getDay();
    dayUploadCounts[day]++;
    dayViewSums[day] += v.viewCount;
  }
  for (let i = 0; i < 7; i++) {
    dayViewAvgs[i] = dayUploadCounts[i] > 0 ? Math.round(dayViewSums[i] / dayUploadCounts[i]) : 0;
  }
  const maxDayAvg = Math.max(...dayViewAvgs, 1);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1 text-teal-400">
        {sortAsc ? "\u2191" : "\u2193"}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Channel Profile Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-20 h-20 rounded-full border-2 border-gray-700 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{channel.title}</h2>
            {channel.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{channel.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div>
                <span className="text-gray-500">구독자</span>{" "}
                <span className="text-white font-semibold">{formatNumber(channel.subscriberCount)}</span>
              </div>
              <div>
                <span className="text-gray-500">총 조회수</span>{" "}
                <span className="text-white font-semibold">{formatNumber(channel.viewCount)}</span>
              </div>
              <div>
                <span className="text-gray-500">영상 수</span>{" "}
                <span className="text-white font-semibold">{formatNumber(channel.videoCount)}</span>
              </div>
              <div>
                <span className="text-gray-500">개설일</span>{" "}
                <span className="text-white font-semibold">{formatDate(channel.createdAt)}</span>
              </div>
            </div>
            {channel.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {channel.keywords.slice(0, 10).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400"
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
          label="최적 업로드 요일"
          value={insights.bestDayOfWeek}
          sub={`${insights.bestHour}시 업로드 시 조회수 높음`}
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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
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
                src={`https://img.youtube.com/vi/${insights.bestVideo.videoId}/mqdefault.jpg`}
                alt={insights.bestVideo.title}
                className="w-40 h-auto rounded-lg border border-gray-700 hover:border-teal-600 transition"
              />
            </a>
            <div className="min-w-0">
              <a
                href={`https://www.youtube.com/watch?v=${insights.bestVideo.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-teal-400 transition line-clamp-2"
              >
                {insights.bestVideo.title}
              </a>
              <p className="text-sm text-gray-500 mt-1">
                조회수 {formatNumber(insights.bestVideo.viewCount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Timing Heatmap */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">요일별 업로드 분석</h3>
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((name, i) => {
            const intensity = maxDayAvg > 0 ? dayViewAvgs[i] / maxDayAvg : 0;
            const bgOpacity = Math.max(0.1, intensity);
            return (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-500 mb-2">{name}</div>
                <div
                  className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold border border-gray-700"
                  style={{
                    backgroundColor: `rgba(20, 184, 166, ${bgOpacity})`,
                    color: intensity > 0.5 ? "#ffffff" : "#9ca3af",
                  }}
                >
                  {dayUploadCounts[i]}
                </div>
                <div className="text-[10px] text-gray-600 mt-1">
                  {dayViewAvgs[i] > 0 ? formatNumber(dayViewAvgs[i]) : "-"}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-600 mt-3">
          숫자 = 업로드 횟수 / 하단 = 평균 조회수 / 색상 진할수록 조회수 높음
        </p>
      </div>

      {/* Recent Videos Table */}
      {sortedVideos.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400">
              최근 영상 ({recentVideos.length}개)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-5 py-3 font-medium">영상</th>
                  <th
                    className="text-right px-3 py-3 font-medium cursor-pointer hover:text-teal-400 transition select-none"
                    onClick={() => handleSort("viewCount")}
                  >
                    조회수{sortIndicator("viewCount")}
                  </th>
                  <th
                    className="text-right px-3 py-3 font-medium cursor-pointer hover:text-teal-400 transition select-none"
                    onClick={() => handleSort("likeCount")}
                  >
                    좋아요{sortIndicator("likeCount")}
                  </th>
                  <th
                    className="text-right px-3 py-3 font-medium cursor-pointer hover:text-teal-400 transition select-none"
                    onClick={() => handleSort("commentCount")}
                  >
                    댓글{sortIndicator("commentCount")}
                  </th>
                  <th
                    className="text-right px-5 py-3 font-medium cursor-pointer hover:text-teal-400 transition select-none"
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
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                  >
                    <td className="px-5 py-3 max-w-xs">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-teal-400 transition line-clamp-1"
                        title={video.title}
                      >
                        {video.title}
                      </a>
                    </td>
                    <td className="text-right px-3 py-3 text-gray-300 tabular-nums">
                      {formatNumber(video.viewCount)}
                    </td>
                    <td className="text-right px-3 py-3 text-gray-400 tabular-nums">
                      {formatNumber(video.likeCount)}
                    </td>
                    <td className="text-right px-3 py-3 text-gray-400 tabular-nums">
                      {formatNumber(video.commentCount)}
                    </td>
                    <td className="text-right px-5 py-3 text-gray-500 tabular-nums whitespace-nowrap">
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-gray-600 mt-1">{sub}</p>
    </div>
  );
}
