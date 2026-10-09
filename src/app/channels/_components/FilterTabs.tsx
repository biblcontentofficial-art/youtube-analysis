"use client";

/**
 * 정렬 탭(세그먼트, DESIGN 6.6). 선택은 aria-pressed 로만 표시한다(bg-surface-3).
 * 탭 묶음은 자체 가로 스크롤이라 좁은 화면에서도 페이지가 옆으로 넘치지 않는다.
 * 정렬 설명은 화면에 한 벌만 둔다(검색 전 안내 목록 · 검색 뒤 ChannelSortCaption). 탭 hover 말풍선은 없앴다.
 */
import type { SortMode } from "@/lib/channelSort";
import { SEGMENT, SEGMENT_ITEM } from "@/components/ui/chip";
import { cx } from "@/components/ui/button";
import { replaceChannelSort, useChannelSort } from "./listState";

export const SORT_TABS: { key: SortMode; label: string }[] = [
  { key: "trending", label: "영상 평균 조회수 순" },
  { key: "growth", label: "월 구독자 증가량 순" },
  { key: "new", label: "신생 채널 · 평균 조회수 순" },
];

interface Props {
  query: string;
}

export default function FilterTabs({ query }: Props) {
  // 현재 탭은 주소의 sort 에서 읽는다(서버가 넘기지 않음).
  const { sort: current } = useChannelSort();

  const handleChange = (key: SortMode) => {
    if (!query) return;
    // 서버를 다시 부르지 않고 주소만 바꾼다(재검색·재차감 없음). 탭을 바꾸면 개설일 정렬은 풀린다.
    replaceChannelSort(query, key, null);
  };

  return (
    <div
      data-sort-tabs
      // 검색 전에는 탭이 비활성이라 포커스가 들어가지 않는다. 좁은 화면에서 가려진 탭 이름을 키보드로도 스크롤해 보게 상자가 포커스를 받는다
      // (이름 있는 영역으로 읽히게 role·aria-label 을 함께 준다. 640 미만은 상자가 화면 폭과 같아 링을 안쪽에 그린다)
      tabIndex={query ? undefined : 0}
      role={query ? undefined : "region"}
      aria-label={query ? undefined : "정렬 탭"}
      className="scrollbar-hide -mx-6 min-w-0 overflow-x-auto px-6 focus-visible:-outline-offset-2 sm:mx-0 sm:px-0 sm:focus-visible:outline-offset-2"
    >
      <div role="group" aria-label="정렬" className={cx(SEGMENT, "w-max bg-surface")}>
        {SORT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleChange(tab.key)}
            disabled={!query}
            aria-pressed={current === tab.key}
            className={cx(SEGMENT_ITEM, "disabled:cursor-not-allowed disabled:opacity-40")}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
