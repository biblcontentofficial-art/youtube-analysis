/**
 * 표 클래스(앱 결과 표·요금제 비교표·브레이크아웃·랭킹이 함께 쓴다). 서버·클라이언트 공용, 의존성 없음.
 * 근거: DESIGN.md 6.10 (값은 확정 시안 app.html .th·.td·.th-sort·.row, home.html 미리보기 표 실측)
 *
 *   <table className={TABLE}>
 *     <thead>
 *       <tr>
 *         <th scope="col" className={TH}>영상</th>
 *         <th scope="col" aria-sort="descending" className={cx(TH, "text-right")}>
 *           <button type="button" className={cx(TH_SORT, TH_SORT_ACTIVE)}>조회수</button>
 *         </th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr className={selected ? ROW_SELECTED : ROW}>
 *         <td className={TD}>…</td>
 *         <td className={cx(TD, NUM)}>74.4만</td>
 *       </tr>
 *     </tbody>
 *   </table>
 *
 * - border-separate + spacing 0: 머리 칸 sticky 와 칸 테두리가 함께 움직이게 한다(border-collapse 는 sticky 칸의 선이 남는다).
 * - 정렬 중인 열은 머리 칸 th 에 aria-sort, 버튼에 TH_SORT_ACTIVE(흰 600) + 화살표.
 * - 선택 행 표시는 흰 2px 왼쪽 막대(첫 칸 inset). 그림자가 아니라 막대를 그리는 문법이다(DESIGN 5.4).
 */

/** 표 틀 */
export const TABLE = "w-full table-fixed border-separate border-spacing-0 text-left";

/** 앱 표 머리 칸: 전역 네비(56px · 1280 이상 64px) 아래에 붙는다 */
export const TH =
  "sticky top-14 z-10 border-y border-line bg-canvas py-0.5 text-micro font-medium text-fg-3 nav:top-16";

/** 머리 칸 안 정렬 버튼(높이 40px · 터치 기기 44px) */
export const TH_SORT =
  "-mx-2 inline-flex h-10 items-center gap-1 rounded-md px-2 transition-colors duration-150 hover:text-fg pointer-coarse:h-11";

/** 지금 정렬 중인 열의 버튼(또는 머리 칸 글자) */
export const TH_SORT_ACTIVE = "font-semibold text-accent";

/** 앱 표 칸 */
export const TD = "border-b border-line-soft py-2.5 align-middle";

/** 숫자 칸: 오른쪽 정렬 + 자리 맞춤 */
export const NUM = "tnum text-right";

/** 결과 행: hover 는 검정 위에서 보이는 한 단 */
export const ROW = "transition-colors duration-150 hover:bg-surface-2/55";

/** 선택된 행: surface-2 면 + 첫 칸 왼쪽 흰 2px 막대 */
export const ROW_SELECTED =
  "bg-surface-2 transition-colors duration-150 [&>td:first-child]:shadow-[inset_2px_0_0_var(--color-accent)]";

/** 홈 결과 미리보기 표 머리 칸(sticky 없음) */
export const TH_PREVIEW = "border-y border-line py-2.5 text-micro font-medium text-fg-3";

/** 홈 결과 미리보기 표 칸 */
export const TD_PREVIEW = "border-b border-line-soft py-3 align-middle";
