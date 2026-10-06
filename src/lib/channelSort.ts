/**
 * 채널 찾기 정렬 (순수 함수, 브라우저에서 실행).
 *
 * 서버는 검색 결과(최대 25개)를 정렬하지 않고 그대로 넘긴다. 정렬 탭·개설일 토글은 이 함수로
 * 화면에서만 다시 줄 세운다. 서버를 다시 부르지 않으므로 채널 검색 횟수가 다시 차감되지 않는다.
 *
 * 채널 나이는 기준 시각 now(ms)로 계산한다. 서버 렌더와 하이드레이션이 같은 순서·값을 내도록
 * 페이지가 한 번 정한 now 를 그대로 넘긴다.
 */
import type { ChannelResult } from "./youtube";

export type SortMode = "trending" | "growth" | "new";
export type DateOrder = "asc" | "desc" | null;

const SORT_MODES: SortMode[] = ["trending", "growth", "new"];

/** 주소의 sort 값. 모르는 값이면 기본 탭(trending). */
export function parseSortMode(raw: string | null | undefined): SortMode {
  return SORT_MODES.includes(raw as SortMode) ? (raw as SortMode) : "trending";
}

/** 주소의 dateOrder 값. asc·desc 가 아니면 null(개설일 정렬 꺼짐). */
export function parseDateOrder(raw: string | null | undefined): DateOrder {
  return raw === "asc" || raw === "desc" ? raw : null;
}

export function channelAgeMonths(publishedAt: string, now: number): number {
  if (!publishedAt) return 9999;
  return Math.max(1, (now - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export function sortChannels(
  items: ChannelResult[],
  sort: SortMode,
  dateOrder: DateOrder,
  now: number
): ChannelResult[] {
  const list = [...items];

  if (sort === "trending")
    return list.sort(
      (a, b) =>
        b.viewCount / Math.max(b.subscriberCount, 1) -
        a.viewCount / Math.max(a.subscriberCount, 1)
    );

  if (sort === "growth")
    return list.sort(
      (a, b) =>
        b.subscriberCount / channelAgeMonths(b.publishedAt, now) -
        a.subscriberCount / channelAgeMonths(a.publishedAt, now)
    );

  if (sort === "new") {
    // 개설일 정렬 필터가 활성화된 경우
    if (dateOrder) {
      return list.sort((a, b) => {
        const ta = new Date(a.publishedAt || 0).getTime();
        const tb = new Date(b.publishedAt || 0).getTime();
        return dateOrder === "asc" ? ta - tb : tb - ta;
      });
    }
    // 기본: 신생(3년 이내) 채널 우선 → 영상당 평균 조회수 순
    const isNew = (c: ChannelResult) => channelAgeMonths(c.publishedAt, now) <= 36;
    return [
      ...list.filter(isNew).sort((a, b) => b.avgViewsPerVideo - a.avgViewsPerVideo),
      ...list.filter((c) => !isNew(c)).sort((a, b) => b.avgViewsPerVideo - a.avgViewsPerVideo),
    ];
  }

  return list;
}
