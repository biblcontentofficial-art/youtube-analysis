/**
 * 칩(필터·기간·키워드)과 세그먼트 토글. 선택되면 면이 한 단 올라간다(Raycast 칩, reference-design §2.7).
 * 근거: docs/ux-renewal/ROADMAP.md R04 · spec/reference-design.md §4.4
 *
 * 선택 상태는 색 클래스를 갈아 끼우지 않고 ARIA 속성으로 표시한다(스크린 리더에도 같은 상태가 전달된다).
 *   필터 칩(켜고 끄기)      <button aria-pressed={on} className={CHIP}>쇼츠</button>
 *   이동하는 칩(현재 위치)   <Link aria-current={active ? "page" : undefined} className={CHIP}>
 *   바로 실행하는 칩         <button className={CHIP}>캠핑</button>   (상태 속성 없음)
 *
 *   세그먼트 토글
 *   <div role="radiogroup" aria-label="결제 주기" className={SEGMENT}>
 *     <button role="radio" aria-checked={monthly} className={SEGMENT_ITEM}>월간</button>
 *   </div>
 *   탭이면 role="tab" + aria-selected, 토글 버튼이면 aria-pressed 를 쓴다(셋 다 같은 모양).
 */

export const CHIP =
  "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-800 px-3 text-[13px] text-neutral-300 transition-colors duration-150 hover:border-neutral-700 hover:text-white aria-pressed:border-neutral-600 aria-pressed:bg-neutral-800 aria-pressed:text-white aria-[current=page]:border-neutral-600 aria-[current=page]:bg-neutral-800 aria-[current=page]:text-white";

/** 세그먼트 토글 틀(오목면) */
export const SEGMENT = "inline-flex rounded-full border border-neutral-800 bg-neutral-950 p-1";

/** 세그먼트 항목. 선택된 항목만 면이 neutral-800 으로 올라간다 */
export const SEGMENT_ITEM =
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-neutral-400 transition-colors duration-150 hover:text-white aria-selected:bg-neutral-800 aria-selected:text-white aria-checked:bg-neutral-800 aria-checked:text-white aria-pressed:bg-neutral-800 aria-pressed:text-white";
