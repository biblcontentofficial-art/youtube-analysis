/**
 * 배지·태그 클래스(상태·분류 표시용). 누르는 것은 칩(chip.ts)을 쓴다.
 * 근거: DESIGN.md 6.12 (모노크롬 실버)
 *
 *   <span className={badgeClass()}>준비중</span>
 *   <span className={badgeClass("solid")}>추천</span>
 *
 * - accent(흰 600 글자)는 neutral(실버 500 글자)과 굵기·밝기로 구분한다. solid(흰 면)는 사이트에서 추천 표시 한 곳만.
 * - warn·danger·success 는 기능 색(caution·negative·positive) 글자·테두리. 면은 칠하지 않는다. 색만으로 말하지 않게 글자를 함께 쓴다.
 * - 굵기는 톤마다 정한다. 공통 문자열에 굵기를 두고 톤에서 덮으면 Tailwind 가 같은 속성 클래스를
 *   이름순으로 출력해 의도와 다른 굵기가 이길 수 있다.
 */
import { cx } from "./button";

export type BadgeTone = "neutral" | "accent" | "warn" | "danger" | "success" | "solid";

const BADGE_BASE = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md py-0.5 text-micro";

// 테두리·좌우 여백도 톤마다 둔다. solid 는 6.12 레시피대로 테두리 없이 px-2.
const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "border border-line-strong px-1.5 font-medium text-fg-2",
  accent: "border border-line-strong px-1.5 font-semibold text-accent",
  warn: "border border-caution/55 px-1.5 font-medium text-caution",
  danger: "border border-negative/55 px-1.5 font-medium text-negative",
  success: "border border-positive/55 px-1.5 font-medium text-positive",
  solid: "bg-accent px-2 font-bold text-accent-ink",
};

export function badgeClass(tone: BadgeTone = "neutral"): string {
  return cx(BADGE_BASE, BADGE_TONE[tone]);
}
