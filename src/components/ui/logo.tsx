/**
 * 비블랩 로고: 실버 판 B 마크 + "bibl"(fg) " lab"(silver). 링크는 쓰는 곳에서 감싼다.
 * 근거: DESIGN.md 6.1 (모노크롬 실버, 실버 판 B)
 *
 *   <Link href="/" className="inline-flex h-11 items-center rounded-md"><Logo /></Link>   네비(header, 판 36px)
 *   <Logo variant="footer" />                                                            푸터(판 32px)
 *   <Logo variant="paper" />                                                             흰 바탕 문서·이미지(검정 판)
 *   <LogoMark />                                                                         단독 마크
 *
 * - 판은 단색(그라데이션·광택·그림자·테두리 없음). B 글자는 판 높이의 약 61%, 반경은 판의 약 22%.
 * - B 글자는 인라인 글꼴 지정 없이 사이트 글꼴(Pretendard)을 따른다.
 * - 흰 바탕(paper)에서는 실버가 1.71:1 이라 글자로 못 쓰므로 판 paper-ink · ' lab' paper-muted 로 바꾼다.
 */
import { cx } from "./button";

export type LogoVariant = "header" | "footer" | "paper";
/** 옛 크기 이름(md = header, sm = footer). 새 코드는 variant 를 쓴다 */
export type LogoSize = "sm" | "md";

/** header: 판 36px · B 22px · 글자 17px / footer: 판 32px · B 19px · 글자 14px / paper: header 크기 */
const MARK_SIZE: Record<LogoVariant, string> = {
  header: "size-9 rounded-lg text-[22px]",
  footer: "size-8 rounded-[7px] text-[19px]",
  paper: "size-9 rounded-lg text-[22px]",
};

const MARK_COLOR: Record<LogoVariant, string> = {
  header: "bg-logo-plate text-accent-ink",
  footer: "bg-logo-plate text-accent-ink",
  paper: "bg-paper-ink text-paper",
};

const WORDMARK_SIZE: Record<LogoVariant, string> = {
  header: "text-[17px]",
  footer: "text-body-sm",
  paper: "text-[17px]",
};

const GAP: Record<LogoVariant, string> = {
  header: "gap-2.5",
  footer: "gap-2",
  paper: "gap-2.5",
};

function resolve(variant?: LogoVariant, size?: LogoSize): LogoVariant {
  if (variant) return variant;
  return size === "sm" ? "footer" : "header";
}

/** B 마크만. 장식이라 스크린 리더에서 숨긴다 */
export function LogoMark({
  variant,
  size,
  className,
}: {
  variant?: LogoVariant;
  /** @deprecated variant 를 쓴다 */
  size?: LogoSize;
  className?: string;
}) {
  const v = resolve(variant, size);
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center font-black leading-none",
        MARK_SIZE[v],
        MARK_COLOR[v],
        className,
      )}
    >
      B
    </span>
  );
}

/** 마크 + 워드마크. 접근 이름은 워드마크 글자("bibl lab")가 된다 */
export function Logo({
  variant,
  size,
  className,
}: {
  variant?: LogoVariant;
  /** @deprecated variant 를 쓴다(sm = footer, md = header) */
  size?: LogoSize;
  className?: string;
}) {
  const v = resolve(variant, size);
  return (
    <span className={cx("inline-flex items-center", GAP[v], className)}>
      <LogoMark variant={v} />
      <span className={cx("font-bold tracking-tight", WORDMARK_SIZE[v], v === "paper" ? "text-paper-ink" : "text-fg")}>
        bibl
        <span className={v === "paper" ? "text-paper-muted" : "text-silver"}> lab</span>
      </span>
    </span>
  );
}
