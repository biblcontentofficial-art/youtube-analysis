"use client";

import { useRouter } from "next/navigation";

export type SortMode = "trending" | "growth" | "new";

const TrendingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
  </svg>
);

const GrowthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const NewIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const TABS: { key: SortMode; Icon: () => JSX.Element; label: string; tooltip: string }[] = [
  {
    key: "trending",
    Icon: TrendingIcon,
    label: "영상 평균 조회수 순",
    tooltip: "영상 하나하나가 꾸준히 잘 터지는 채널을 찾을 때",
  },
  {
    key: "growth",
    Icon: GrowthIcon,
    label: "월 구독자 증가량 순",
    tooltip: "월 평균 구독자 증가가 많은 채널을 찾을 때",
  },
  {
    key: "new",
    Icon: NewIcon,
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
              <tab.Icon />
              <span>{tab.label}</span>
            </button>

            {/* 툴팁 */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
              opacity-0 group-hover/tab:opacity-100 transition-opacity duration-150">
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-xl w-64 text-left">
                <p className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <tab.Icon />
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
