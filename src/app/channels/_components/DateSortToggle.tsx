"use client";

import { useRouter } from "next/navigation";

type DateOrder = "asc" | "desc" | null;

interface Props {
  query: string;
  dateOrder: DateOrder;
}

export default function DateSortToggle({ query, dateOrder }: Props) {
  const router = useRouter();

  const cycle = () => {
    if (!query) return;
    // null → desc → asc → null
    const next: Record<string, string | null> = {
      desc: "asc",
      asc:  null,
    };
    const nextVal = dateOrder === null ? "desc" : next[dateOrder] ?? null;
    const params = new URLSearchParams({ q: query, sort: "new" });
    if (nextVal) params.set("dateOrder", nextVal);
    router.push(`/channels?${params.toString()}`);
  };

  const label =
    dateOrder === "desc" ? "개설일 최신순 ↓"
    : dateOrder === "asc"  ? "개설일 오래된순 ↑"
    : "개설일 정렬";

  const active = dateOrder !== null;

  return (
    <button
      onClick={cycle}
      disabled={!query}
      title="클릭하여 채널 개설일 정렬 전환 (최신순 → 오래된순 → 기본)"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap
        ${active
          ? "border-teal-600 text-teal-400 bg-teal-950/40 hover:bg-teal-950/60"
          : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 bg-transparent"
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 3v10M4 13l-2-2M4 13l2-2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 13V3M10 3l-2 2M10 3l2 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}
