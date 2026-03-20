"use client";

import { useMemo } from "react";
import { Video } from "@/types";

interface ChannelStat {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string;
  subscriberCountRaw: number;
  subscriberCount: string;
  videoCount: number;
  totalViews: number;
  avgViews: number;
  maxRatio: number;
  goodCount: number;
  topVideo: Video;
}

interface Props {
  videos: Video[];
  onClose: () => void;
}

function formatNum(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return Math.round(n / 10000) + "만";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
}

export default function ChannelReport({ videos, onClose }: Props) {
  const channels = useMemo<ChannelStat[]>(() => {
    const map = new Map<string, ChannelStat>();

    for (const v of videos) {
      if (!map.has(v.channelId)) {
        map.set(v.channelId, {
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          channelThumbnail: v.channelThumbnail,
          subscriberCountRaw: v.subscriberCountRaw,
          subscriberCount: v.subscriberCount,
          videoCount: 0,
          totalViews: 0,
          avgViews: 0,
          maxRatio: 0,
          goodCount: 0,
          topVideo: v,
        });
      }
      const ch = map.get(v.channelId)!;
      ch.videoCount++;
      ch.totalViews += v.viewCount ?? 0;
      if ((v.performanceRatioRaw ?? 0) > ch.maxRatio) {
        ch.maxRatio = v.performanceRatioRaw ?? 0;
        ch.topVideo = v;
      }
      if (v.score === "Good") ch.goodCount++;
    }

    const result = Array.from(map.values()).map((ch) => ({
      ...ch,
      avgViews: ch.videoCount > 0 ? Math.round(ch.totalViews / ch.videoCount) : 0,
    }));

    // 영상 수 내림차순 → 평균 조회수 내림차순
    result.sort((a, b) => b.videoCount - a.videoCount || b.avgViews - a.avgViews);
    return result;
  }, [videos]);

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[85vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-white font-semibold text-base">채널 분석 리포트</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              검색 결과 {videos.length}개 영상 · {channels.length}개 채널
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* 테이블 */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr className="text-[11px] text-gray-500 font-medium">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">채널</th>
                <th className="text-right px-4 py-3 whitespace-nowrap">구독자</th>
                <th className="text-right px-4 py-3 whitespace-nowrap">영상 수</th>
                <th className="text-right px-4 py-3 whitespace-nowrap">평균 조회수</th>
                <th className="text-right px-4 py-3 whitespace-nowrap">Good 수</th>
                <th className="text-right px-4 py-3 whitespace-nowrap">최대 아웃라이어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {channels.map((ch, idx) => (
                <tr key={ch.channelId} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-600 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.youtube.com/channel/${ch.channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 hover:text-teal-400 transition-colors group"
                    >
                      {ch.channelThumbnail ? (
                        <img
                          src={ch.channelThumbnail}
                          alt={ch.channelTitle}
                          className="w-7 h-7 rounded-full object-cover shrink-0 bg-gray-800"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-800 shrink-0" />
                      )}
                      <span className="text-gray-200 group-hover:text-teal-400 font-medium text-xs leading-snug line-clamp-1">
                        {ch.channelTitle}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs tabular-nums">
                    {formatNum(ch.subscriberCountRaw)}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-semibold text-xs tabular-nums">
                    {ch.videoCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-xs tabular-nums">
                    {formatNum(ch.avgViews)}회
                  </td>
                  <td className="px-4 py-3 text-right text-xs tabular-nums">
                    {ch.goodCount > 0 ? (
                      <span className="text-green-400 font-semibold">{ch.goodCount}</span>
                    ) : (
                      <span className="text-gray-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs tabular-nums">
                    <span className={
                      ch.maxRatio >= 3.0 ? "text-purple-400 font-semibold" :
                      ch.maxRatio >= 1.5 ? "text-red-400 font-semibold" :
                      ch.maxRatio >= 0.8 ? "text-green-400" :
                      "text-gray-500"
                    }>
                      {ch.maxRatio > 0 ? ch.maxRatio.toFixed(1) + "x" : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {channels.length === 0 && (
            <div className="py-16 text-center text-gray-600 text-sm">데이터 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}
