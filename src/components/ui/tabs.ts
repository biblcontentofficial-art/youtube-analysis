/**
 * 밑줄 탭(CommunityTabs 패턴). 현재 탭은 흰 글자 + 흰 2px 밑줄(accent).
 * 근거: DESIGN.md 6.3 · ux-rules 5.7(이동은 링크 + aria-current, 전환은 role="tab" + aria-selected)
 *
 *   <nav aria-label="커뮤니티 메뉴" className={TAB_BAR}>
 *     <div className={TAB_LIST}>
 *       <Link href="/community" aria-current={active ? "page" : undefined} className={TAB}>커뮤니티</Link>
 *     </div>
 *   </nav>
 *
 * 바닥 선(TAB_BAR)과 가로 스크롤(TAB_LIST)을 다른 요소에 둔다. 스크롤 상자는 넘친 부분을 잘라내므로
 * 한 요소에 선과 스크롤을 같이 두고 탭에 -mb-px 를 주면 현재 탭 밑줄의 아래 1px 가 잘리고 1px 세로 스크롤이 생긴다.
 * 여기서는 TAB_LIST 가 -mb-px 로 바닥 선과 1px 겹쳐, 현재 탭 밑줄이 선 위에 그려진다.
 */

/** 탭 줄 바깥: 바닥 헤어라인 */
export const TAB_BAR = "border-b border-line";

/** 탭 목록: 좁은 화면에서 가로로 스크롤 */
export const TAB_LIST = "-mb-px flex gap-1 overflow-x-auto";

/** 탭 하나. 상태는 aria-current="page"(링크) 또는 aria-selected(role="tab")로만 바뀐다 */
export const TAB =
  "shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm text-fg-3 transition-colors duration-150 hover:text-fg aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent aria-selected:border-accent aria-selected:font-semibold aria-selected:text-accent";
