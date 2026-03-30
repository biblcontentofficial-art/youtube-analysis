"use client";

import { useMemo } from "react";
import type { ThreadPost } from "@/lib/threads";
import { analyzePostTimes } from "@/lib/threads";

function fmtNum(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

interface Props {
  posts: ThreadPost[];
}

export default function PostTimeAnalysis({ posts }: Props) {
  const insight = useMemo(() => analyzePostTimes(posts), [posts]);

  if (insight.totalPosts < 5) return null; // 데이터 부족 시 숨김

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">게시 시간 분석</h3>

      {/* 인사이트 문구 */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-3 text-sm text-teal-400">
        이 키워드는 <span className="font-bold">{insight.bestDay}요일 {insight.bestHour}시</span>에
        반응이 가장 좋아요 (평균 {fmtNum(insight.bestDayHourAvg)})
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 요일별 분포 */}
        <div>
          <p className="text-xs text-gray-500 mb-2">요일별 반응</p>
          <div className="grid grid-cols-7 gap-1.5">
            {insight.slots.map((s) => (
              <div
                key={s.dayName}
                className="text-center rounded-lg p-2 border transition"
                style={{
                  borderColor: `rgba(45, 212, 191, ${s.intensity * 0.5 + 0.1})`,
                  backgroundColor: `rgba(45, 212, 191, ${s.intensity * 0.15})`,
                }}
              >
                <div className="text-[10px] text-gray-400">{s.dayName}</div>
                <div className="text-xs font-bold text-white mt-0.5">{s.count}</div>
                <div className="text-[9px] text-gray-600">{fmtNum(s.avgEngagement)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 분포 (6시간 블록) */}
        <div>
          <p className="text-xs text-gray-500 mb-2">시간대별 반응</p>
          <div className="space-y-1.5">
            {[
              { label: "새벽 (0~5시)", hours: [0, 1, 2, 3, 4, 5] },
              { label: "오전 (6~11시)", hours: [6, 7, 8, 9, 10, 11] },
              { label: "오후 (12~17시)", hours: [12, 13, 14, 15, 16, 17] },
              { label: "저녁 (18~23시)", hours: [18, 19, 20, 21, 22, 23] },
            ].map((block) => {
              const blockSlots = block.hours.map((h) => insight.hourSlots[h]);
              const totalCount = blockSlots.reduce((s, sl) => s + sl.count, 0);
              const totalEng = blockSlots.reduce((s, sl) => s + sl.avgEngagement * sl.count, 0);
              const avgEng = totalCount > 0 ? Math.round(totalEng / totalCount) : 0;
              const maxCount = Math.max(...insight.hourSlots.map((s) => s.count), 1);
              const ratio = totalCount / Math.max(maxCount * block.hours.length, 1);

              return (
                <div key={block.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-24 shrink-0">{block.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-teal-500/60 h-3 rounded-full transition-all flex items-center justify-end pr-1"
                      style={{ width: `${Math.max(ratio * 100, 4)}%` }}
                    >
                      {totalCount > 0 && (
                        <span className="text-[8px] text-white font-medium">{totalCount}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 w-14 text-right shrink-0">
                    평균 {fmtNum(avgEng)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
