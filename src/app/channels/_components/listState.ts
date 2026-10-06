/**
 * 채널 찾기 목록의 브라우저 상태: 정렬(주소에 기록)과 상세에서 돌아오기.
 *
 * 목록 주소(/channels?q=…)를 서버에 다시 요청하면 서버가 검색을 다시 돌려 채널 검색 횟수가 또 차감된다.
 * 그래서 정렬은 router.push·router.replace 대신 history.replaceState 로 주소만 바꾸고,
 * 상세의 "돌아가기"는 목록에서 넘어온 경우 router.back() 으로 이미 받은 화면을 되살린다.
 */
import { useSearchParams } from "next/navigation";
import { parseDateOrder, parseSortMode, type DateOrder, type SortMode } from "@/lib/channelSort";

/**
 * 현재 정렬 상태. 주소가 유일한 출처라서 탭·토글·안내 문구·표가 늘 같은 값을 본다.
 * 상세에서 router.back() 으로 돌아와도 바꿔 둔 정렬이 그대로 보인다.
 */
export function useChannelSort(): { sort: SortMode; dateOrder: DateOrder } {
  const params = useSearchParams();
  return {
    sort: parseSortMode(params.get("sort")),
    dateOrder: parseDateOrder(params.get("dateOrder")),
  };
}

/**
 * 주소의 sort·dateOrder 만 바꾼다. Next 14.1+ 는 history.replaceState 를 라우터와 연동해
 * useSearchParams 를 갱신하고, 서버 요청은 보내지 않는다.
 */
export function replaceChannelSort(query: string, sort: SortMode, dateOrder: DateOrder) {
  const params = new URLSearchParams({ q: query, sort });
  if (dateOrder) params.set("dateOrder", dateOrder);
  window.history.replaceState(null, "", `/channels?${params.toString()}`);
}

// 같은 탭에서 목록 → 상세로 넘어간 상세 경로. 이 탭의 메모리에만 있고 새로고침·새 탭에서는 비어 있다.
let detailFromList: string | null = null;

/** 목록의 채널 링크를 (수정 키 없이) 눌렀을 때 부른다. */
export function rememberDetailFromList(detailPath: string) {
  detailFromList = detailPath;
}

/** 지금 보고 있는 상세가 이 탭의 목록에서 넘어온 것인지. */
export function cameFromChannelList(detailPath: string): boolean {
  return detailFromList === detailPath;
}

/** 새 탭·새 창으로 여는 클릭(수정 키·가운데 버튼)이 아닌지. */
export function isPlainLeftClick(e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
