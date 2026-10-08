/**
 * 버튼 클래스. <button>·<a>·<Link> 에 같은 함수를 쓴다(서버·클라이언트 공용, 의존성 없음).
 * 레시피 근거: DESIGN.md 6.5 (모노크롬 실버)
 *
 *   <Link href="/" className={buttonClass()}>홈으로</Link>
 *   <button className={buttonClass({ variant: "secondary", size: "sm" })}>취소</button>
 *
 * - Tailwind 가 클래스를 찾을 수 있게 맵 값은 모두 완성된 문자열이다. 이름을 조립하지 않는다(T17).
 * - 흰 면(primary)은 화면 한 폴드에 하나만 쓴다. 네비 "시작하기"는 별도.
 * - 포커스 링은 globals.css 의 전역 :focus-visible(흰 2px)을 그대로 쓴다.
 *   outline-none·outline-hidden 을 섞으면 그 링이 사라지므로 넣지 않는다.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "kakao";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  // 흰 면. hover 한 단 어둡게, 누르면 실버 판 색
  primary: "bg-accent font-bold text-accent-ink hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "border border-line-strong bg-surface font-semibold text-fg hover:border-line-hover hover:bg-surface-2",
  ghost: "font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg",
  // 삭제·해지. 빨간 면 금지, negative 테두리·글자만
  danger: "border border-negative/40 font-semibold text-negative hover:border-negative hover:bg-surface-2",
  // 카카오 브랜드 예외(노란 면). 카카오 로그인·문의·공유 버튼에만
  kakao: "bg-kakao text-kakao-ink font-bold hover:bg-kakao-hover",
};

/** 높이 sm 36px(네비·카드 안) · md 44px(기본, 모바일 터치 크기) · lg 48px(히어로·요금제) */
const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-body-sm",
  md: "h-11 px-5 text-ui",
  lg: "h-12 px-6 text-ui",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 부모 폭을 다 쓰는 버튼(모바일 하단 바·폼 제출) */
  block?: boolean;
} = {}): string {
  return cx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], block && "w-full");
}

/**
 * 완성된 클래스 문자열을 공백으로 잇는다(빈 값은 건너뜀). 이름을 만들지 않으므로 Tailwind 검출에 영향이 없다.
 * 같은 속성의 클래스(예: h-11 과 h-10)를 함께 넘기면 어느 쪽이 이길지는 Tailwind 출력 순서가 정하므로,
 * 덮어쓰기 대신 맞는 변형·크기를 고른다.
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
