"use client";

import { useRouter } from "next/navigation";

export type SortMode = "trending" | "growth" | "new";

const TABS: { key: SortMode; icon: string; label: string }[] = [
  { key: "trending", icon: "🔥", label: "영상 평균 조회수 순" },
  { key: "growth",  icon: "📈", label: "월 구독자 증가량 순" },
  { key: "new",     icon: "🌱", label: "신생 채널 · 평균 조회수 순" },
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
    <div className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 p-1 gap-0.5">
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            disabled={!query}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${active
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
