/**
 * 배지 클래스(상태·분류 표시용 작은 알약). 누르는 것은 칩(chip.ts)을 쓴다.
 * 근거: docs/ux-renewal/ROADMAP.md R04 · spec/reference-design.md §4.4
 *
 *   <span className={badgeClass()}>준비중</span>
 *   <span className={badgeClass("solid")}>추천</span>
 *
 * - accent(에메랄드 글자)는 섹션당 하나, solid(흰 면)는 사이트에서 추천 표시 한 곳만.
 * - warn·danger·success 는 보존 시맨틱 색(앰버 경고·레드 오류·그린 성공).
 * - 굵기는 톤마다 정한다. 공통 문자열에 굵기를 두고 톤에서 덮으면 Tailwind 가 같은 속성 클래스를
 *   이름순으로 출력해 의도와 다른 굵기가 이길 수 있다.
 */
import { cx } from "./button";

export type BadgeTone = "neutral" | "accent" | "warn" | "danger" | "success" | "solid";

const BADGE_BASE =
  "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-xs";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "border-neutral-800 bg-neutral-900 font-medium text-neutral-300",
  accent: "border-neutral-700 font-semibold text-accent",
  warn: "border-amber-400/30 font-medium text-amber-400",
  danger: "border-red-400/30 font-medium text-red-400",
  success: "border-green-400/30 font-medium text-green-400",
  solid: "border-white bg-white font-bold text-black",
};

export function badgeClass(tone: BadgeTone = "neutral"): string {
  return cx(BADGE_BASE, BADGE_TONE[tone]);
}
