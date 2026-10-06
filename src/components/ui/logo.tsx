/**
 * 비블랩 로고: B 마크 + "bibl"(흰색) " lab"(neutral-400). 링크는 쓰는 곳에서 감싼다.
 * 근거: docs/ux-renewal/ROADMAP.md R04 · findings system-11 · shell-11(로고 6벌 → 하나)
 *
 *   <Link href="/" className="inline-flex rounded-md"><Logo /></Link>   네비(md)
 *   <Logo size="sm" />                                                  푸터(sm)
 *   <LogoMark />                                                         확인창 머리 같은 단독 마크
 *
 * B 글자는 인라인 글꼴 지정 없이 사이트 글꼴을 따른다(OS 마다 다른 sans-serif 로 바뀌지 않게).
 */
import { cx } from "./button";

export type LogoSize = "sm" | "md";

/** md: 32px 상자·18px 글자(네비) · sm: 28px 상자·16px 글자(푸터) */
const MARK_SIZE: Record<LogoSize, string> = {
  sm: "size-7 rounded-md text-base",
  md: "size-8 rounded-lg text-lg",
};

const WORDMARK_SIZE: Record<LogoSize, string> = {
  sm: "text-sm",
  md: "text-base",
};

/** B 마크만. 장식이라 스크린 리더에서 숨긴다 */
export function LogoMark({ size = "md", className }: { size?: LogoSize; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center border border-neutral-700 bg-black font-black leading-none text-white",
        MARK_SIZE[size],
        className,
      )}
    >
      B
    </span>
  );
}

/** 마크 + 워드마크. 접근 이름은 워드마크 글자("bibl lab")가 된다 */
export function Logo({ size = "md", className }: { size?: LogoSize; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className={cx("font-bold tracking-tight", WORDMARK_SIZE[size])}>
        <span className="text-white">bibl</span>
        <span className="text-neutral-400"> lab</span>
      </span>
    </span>
  );
}
