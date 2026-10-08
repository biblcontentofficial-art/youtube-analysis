/**
 * 목록 패널(홈 '직접 하기' 카드의 미디어 칸 · 트렌드 서치 허브의 단독 패널이 함께 쓴다). 서버·클라이언트 공용.
 * 근거: DESIGN.md 6.27 (값은 확정 시안 home.html 616~624행)
 *
 *   <div aria-hidden="true" className={cx(LIST_PANEL.media, "pointer-events-none select-none lg:h-[340px]")}>   홈 카드 안(장식)
 *   <div className={LIST_PANEL.standalone}>                                                                      허브 단독(항목 = 링크)
 *     <div className={LIST_PANEL_HEAD}>
 *       <span>…</span>
 *       <span className={LIST_PANEL_HEAD_META}>회원 전용 게시판</span>
 *     </div>
 *     <ul className={LIST_PANEL_LIST}>
 *       <li className={LIST_PANEL_ITEM}>
 *         <p className={LIST_PANEL_TITLE}>유튜브 실전 Q&A</p>
 *         <p className={LIST_PANEL_DESC}>설명 한 줄</p>
 *       </li>
 *     </ul>
 *   </div>
 *
 * 잠긴 항목은 제목 옆에 Pro/Starter 태그(DESIGN 6.12) 하나만 붙인다. 단독 패널의 항목 링크는 누름 영역 44px 이상.
 */

/** 패널 틀. media = 카드 안 미디어 칸(아래 선만, 검정 바탕) · standalone = 카드 밖 단독 패널 */
export const LIST_PANEL = {
  media: "flex flex-col overflow-hidden border-b border-line bg-canvas",
  standalone: "flex flex-col overflow-hidden rounded-panel border border-line bg-surface",
} as const;

/** 머리 줄(높이 44px) */
export const LIST_PANEL_HEAD =
  "flex h-11 shrink-0 items-center justify-between gap-4 border-b border-line-soft px-6";

/** 머리 줄 오른쪽 보조 글자 */
export const LIST_PANEL_HEAD_META = "text-micro text-fg-3";

/** 목록 */
export const LIST_PANEL_LIST = "divide-y divide-line-soft px-6";

/** 항목 */
export const LIST_PANEL_ITEM = "py-2.5";

/** 항목 제목(잠금 태그가 붙을 수 있어 flex) */
export const LIST_PANEL_TITLE = "flex items-center gap-1.5 text-body-sm font-semibold leading-[1.5]";

/** 항목 설명 한 줄 */
export const LIST_PANEL_DESC = "mt-0.5 truncate text-caption text-fg-3";
