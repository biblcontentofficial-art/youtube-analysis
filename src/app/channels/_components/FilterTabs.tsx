"use client";

import { useRouter } from "next/navigation";

export type SortMode = "trending" | "growth" | "new";

const TABS: { key: SortMode; icon: string; label: string; tooltip: string }[] = [
  {
    key: "trending",
    icon: "🔥",
    label: "영상 평균 조회수 순",
    tooltip: "영상 하나하나가 꾸준히 잘 터지는 채널을 찾을 때",
  },
  {
    key: "growth",
    icon: "📈",
    label: "월 구독자 증가량 순",
    tooltip: "월 평균 구독자 증가가 많은 채널을 찾을 때",
  },
  {
    key: "new",
    icon: "🌱",
    label: "신생 채널 · 평균 조회수 순",
    tooltip: "분야에서 막 성장 중인 채널 발굴을 원할 때",
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
    <div className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 p-1 gap-0.5">
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <div key={tab.key} className="relative group/tab">
            <button
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

            {/* 툴팁 */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
              opacity-0 group-hover/tab:opacity-100 transition-opacity duration-150">
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-xl w-64 text-left">
                <p className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </p>
                {tab.tooltip.split("\n").map((line, i) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed">{line}</p>
                ))}
              </div>
              {/* 말풍선 꼭지 */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 border-l border-t border-gray-700 rotate-45" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
