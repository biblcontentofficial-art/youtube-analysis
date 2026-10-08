/**
 * 칩(필터·기간·키워드)과 세그먼트 토글. 선택되면 면이 한 단 올라간다(surface-3). 알약 모양 금지, 반경 8px.
 * 근거: DESIGN.md 6.6 (모노크롬 실버)
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

/** 높이 40px(모바일) · 640 이상 36px · 터치 기기 44px */
export const CHIP =
  "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control border border-line px-3 text-caption font-medium text-fg-2 transition-colors duration-150 hover:border-line-hover hover:text-fg sm:h-9 sm:px-2.5 pointer-coarse:h-11 aria-pressed:border-line-hover aria-pressed:bg-surface-3 aria-pressed:text-fg aria-[current=page]:border-line-hover aria-[current=page]:bg-surface-3 aria-[current=page]:text-fg";

/** 세그먼트 토글 틀 */
export const SEGMENT = "inline-flex rounded-control border border-line p-1";

/** 세그먼트 항목. 선택된 항목만 면이 surface-3 으로 올라간다. 높이 40px · 768 이상 32px · 터치 기기 44px */
export const SEGMENT_ITEM =
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-3 text-caption font-medium text-fg-3 transition-colors duration-150 hover:text-fg md:h-8 pointer-coarse:h-11 aria-[current=true]:bg-surface-3 aria-[current=true]:font-semibold aria-[current=true]:text-fg aria-selected:bg-surface-3 aria-selected:font-semibold aria-selected:text-fg aria-checked:bg-surface-3 aria-checked:font-semibold aria-checked:text-fg aria-pressed:bg-surface-3 aria-pressed:font-semibold aria-pressed:text-fg";
