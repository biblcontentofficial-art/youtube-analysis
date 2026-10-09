"use client";

import type { DateOrder } from "@/lib/channelSort";
import { replaceChannelSort, useChannelSort } from "./listState";

interface Props {
  query: string;
}

// 신생 고성장 탭 전용. 다른 탭에서는 그리지 않는다(정렬 상태는 주소에서 읽음).
export default function DateSortToggle({ query }: Props) {
  const { sort, dateOrder } = useChannelSort();
  if (sort !== "new") return null;

  const cycle = () => {
    if (!query) return;
    // null → desc → asc → null
    const next: Record<string, DateOrder> = {
      desc: "asc",
      asc:  null,
    };
    const nextVal = dateOrder === null ? "desc" : next[dateOrder] ?? null;
    // 서버를 다시 부르지 않고 주소만 바꾼다(재검색·재차감 없음).
    replaceChannelSort(query, "new", nextVal);
  };

  const label =
    dateOrder === "desc" ? "개설일 최신순 ↓"
    : dateOrder === "asc"  ? "개설일 오래된순 ↑"
    : "개설일 정렬";

  const active = dateOrder !== null;

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={!query}
      // 상태(기본·최신순·오래된순)는 바뀌는 라벨이 전한다. 세 단계라 aria-pressed 는 쓰지 않는다.
      title="클릭하여 채널 개설일 정렬 전환 (최신순 → 오래된순 → 기본)"
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-caption font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:px-2.5 pointer-coarse:h-11 ${
        active
          ? "border-line-hover bg-surface-3 text-fg"
          : "border-line text-fg-2 hover:border-line-hover hover:text-fg"
      }`}
    >
      <svg aria-hidden="true" className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 3v10M4 13l-2-2M4 13l2-2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 13V3M10 3l-2 2M10 3l2 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}
