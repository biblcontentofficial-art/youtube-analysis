/**
 * 카드 클래스. 그림자 대신 면 밝기 한 단과 1px 선으로 깊이를 만든다(reference-design §2.6).
 * 근거: docs/ux-renewal/ROADMAP.md R04 · spec/reference-design.md §4.4
 *
 *   <div className={cardClass()}>…</div>                         정적 카드
 *   <Link className={cardClass({ link: true })}>…</Link>         누를 수 있는 카드만 hover
 *   <div className={cardClass({ featured: true })}>…</div>       추천 카드 하나(요금제 등)
 */
import { cx } from "./button";

/** 기본 카드 면 */
export const CARD = "rounded-card border border-neutral-800 bg-neutral-900";

/**
 * 추천·강조 카드(화면에 하나). CARD 를 대신한다.
 * CARD 와 함께 쓰면 테두리·면 색 클래스가 겹쳐 Tailwind 출력 순서에 따라 기본 색이 이길 수 있어 완성 문자열로 둔다.
 */
export const CARD_FEATURED = "rounded-card border border-neutral-600 bg-surface-raised";

/**
 * 누를 수 있는 카드에만 붙인다(정적 카드에는 hover 반응을 주지 않는다).
 * a·Link 는 기본이 인라인이라 block 을 넣었다. flex·grid 를 함께 주면 Tailwind 출력 순서상 그쪽이 적용된다.
 * group 은 카드 hover 때 안쪽 화살표 등을 group-hover: 로 바꿀 수 있게 둔다(ux-rules T21).
 */
export const CARD_LINK =
  "group block transition-colors duration-150 hover:border-neutral-700 hover:bg-surface-raised";

/** 안쪽 여백: sm 목록·작은 카드 / md 기본 */
export const CARD_PAD = {
  sm: "p-4 md:p-5",
  md: "p-6 md:p-8",
} as const;

export type CardPad = keyof typeof CARD_PAD;

export function cardClass({
  pad = "md",
  link = false,
  featured = false,
}: {
  pad?: CardPad | false;
  /** 카드 전체가 링크·버튼일 때 */
  link?: boolean;
  /** 추천 카드. 이미 들린 면이라 link 를 함께 줘도 hover 색은 바꾸지 않는다 */
  featured?: boolean;
} = {}): string {
  return cx(
    featured ? CARD_FEATURED : CARD,
    pad && CARD_PAD[pad],
    link && !featured && CARD_LINK,
  );
}
