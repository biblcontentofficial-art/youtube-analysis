"use client";

import { useState, useEffect } from "react";

function fmt(n: number) {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}만`;
  return n.toLocaleString();
}

export default function ViewStatsInline() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ total: number; count: number }>).detail;
      if (detail.count > 0) setTotal(detail.total);
    };
    window.addEventListener("UPDATE_VIEW_STATS", handler);
    return () => window.removeEventListener("UPDATE_VIEW_STATS", handler);
  }, []);

  if (total === null || total === 0) return null;

  return (
    <div className="flex items-center gap-1.5 ml-1">
      <span className="text-gray-700">|</span>
      {total >= 1_0000_0000 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/60 border border-teal-700 text-teal-300 font-semibold">
          시장성 좋음
        </span>
      )}
      <span className="text-xs text-gray-400">
        조회수 합계 <span className="text-white font-medium">{fmt(total)}</span>
      </span>
    </div>
  );
}
