/**
 * 선 아이콘 한 가족. 24 격자, 선 굵기 2, 크기 16·20·24px. 상자·원형 배경 없이 맨 SVG 로 쓴다.
 * 근거: docs/ux-renewal/ROADMAP.md R04 · ux-rules 6.4(이모지 아이콘 금지·한 가족·한 선 굵기)
 *
 *   <SearchIcon />                         장식(aria-hidden). 옆에 글자가 있는 버튼·링크
 *   <CloseIcon size={16} label="닫기" />   글자 없이 아이콘만 있는 버튼이면 label 로 이름을 준다
 *
 * 색은 currentColor 라 부모 글자색을 따른다. width·height 속성을 직접 줘 CSS 가 늦어도 자리를 잡는다(T16).
 */
import type { ReactNode, SVGProps } from "react";
import { cx } from "./button";

export type IconSize = 16 | 20 | 24;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height" | "children" | "ref"> & {
  size?: IconSize;
  /** 뜻이 있는 단독 아이콘의 이름. 없으면 장식으로 보고 스크린 리더에서 숨긴다 */
  label?: string;
};

function IconBase({ size = 20, label, className, children, ...rest }: IconProps & { children: ReactNode }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg
      {...rest}
      {...a11y}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

/** 검색 */
export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </IconBase>
  );
}

/** 오른쪽 화살표(다음·이동) */
export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </IconBase>
  );
}

/** 체크(포함·완료) */
export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 6 9 17l-5-5" />
    </IconBase>
  );
}

/** 닫기·제외 */
export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

/** 잠금(플랜 필요) */
export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
  );
}

/** 아래 화살표(펼치기·더보기) */
export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

/** 외부 링크(새 창) */
export function ExternalLinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </IconBase>
  );
}

/** 재생 */
export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3l14 9-14 9V3z" />
    </IconBase>
  );
}

/** 경고 */
export function WarningIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

/** 정보 */
export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </IconBase>
  );
}
