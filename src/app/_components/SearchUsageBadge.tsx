"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UsageData {
  used: number;
  limit: number;
  plan: string;
  unlimited: boolean;
}

export default function SearchUsageBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage) return null;

  // Business/Admin: 무제한 표시
  if (usage.unlimited) {
    return (
      <Link
        href="/mypage"
        className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-neutral-700 text-neutral-300 transition hover:border-neutral-500"
        title="무제한 검색"
      >
        <span>무제한</span>
      </Link>
    );
  }

  const remaining = Math.max(0, usage.limit - usage.used);
  const isLow = remaining <= 1;
  const isOut = remaining === 0;

  return (
    <Link
      href="/pricing"
      className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition ${
        isOut
          ? "border-red-700 bg-red-950/50 text-red-400 font-semibold"
          : isLow
          ? "border-neutral-500 text-white font-semibold"
          : "border-neutral-700 bg-neutral-900 text-neutral-400"
      }`}
      title={isOut ? "한도 초과 · 업그레이드" : isLow ? "마지막 검색 남음" : "검색 가능 횟수"}
    >
      <span>
        {isOut ? "한도 초과 · 업그레이드" : isLow ? "검색 1회 남음" : `${remaining}회 남음`}
      </span>
    </Link>
  );
}
