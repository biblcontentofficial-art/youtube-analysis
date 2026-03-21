"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type SortMode = "trending" | "growth" | "new";

const TABS: { key: SortMode; icon: string; label: string; desc: string }[] = [
  {
    key: "trending",
    icon: "🔥",
    label: "요즘 뜨는 채널",
    desc: "구독자 대비 조회수가 높은 채널",
  },
  {
    key: "growth",
    icon: "📈",
    label: "구독자 급상승",
    desc: "월 평균 구독자 증가량이 많은 채널",
  },
  {
    key: "new",
    icon: "🌱",
    label: "신생 고성장",
    desc: "최근 3년 내 개설 + 높은 평균 조회수",
  },
];

interface Props {
  current: SortMode;
  query: string;
}

export default function FilterTabs({ current, query }: Props) {
  const router = useRouter();

  const handleChange = (key: SortMode) => {
    if (!query) return;
    router.push(`/channels?q=${encodeURIComponent(query)}&sort=${key}`);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            disabled={!query}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              active
                ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/30"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
