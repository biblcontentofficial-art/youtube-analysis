/**
 * 섹션 헤더(소유자 확정 패턴): 좌측 한글 캡션 + 우측 영문 라벨 + 헤어라인, 그 아래 두 톤 제목.
 * 영문 라벨은 실버(비블을 알리는 반복 장치), 캡션·리드는 fg-3, 제목 굵기는 글자 토큰(800).
 * 근거: DESIGN.md 6.4 · 4.2 (라벨은 시안 .sec-head__label 14/20 → md 16/24, text-label-en 토큰은 쓰지 않는다)
 *
 *   <SectionHeader caption="비블의 유튜브 채널 대행" label="PROBLEM" />
 *   <TwoToneHeading lead="유튜브를 혼자 운영하면서">답답하지 않으셨나요?</TwoToneHeading>
 *
 * 방문 기록(TrackVisit) 같은 동작은 넣지 않는다. 라벨 수만큼 실행되므로 페이지에서 한 번만 둔다.
 */
import type { ReactNode } from "react";
import { cx } from "./button";

/**
 * globals.css 의 스크롤 등장 종류(AnimationObserver 가 있는 페이지에서만 움직인다).
 * rise = 홈 은은한 모션(12px · 500ms), load = 첫 화면 블록이 첫 그림부터 CSS 로 한 번 떠오름
 */
export type AnimateKind = "fade" | "up" | "left" | "right" | "scale" | "rise" | "load";

export function SectionHeader({
  caption,
  label,
  animate,
  className,
}: {
  caption: ReactNode;
  /** 영문 대문자 라벨. 장식이라 스크린 리더는 읽지 않는다 */
  label: string;
  animate?: AnimateKind;
  className?: string;
}) {
  return (
    <div
      data-animate={animate}
      className={cx(
        "mb-10 flex items-center justify-between gap-4 border-b border-line pb-4 md:mb-12",
        className,
      )}
    >
      <span className="text-xs text-fg-3 md:text-sm">{caption}</span>
      <span
        lang="en"
        aria-hidden="true"
        className="shrink-0 text-sm font-black leading-5 tracking-[0.25em] text-silver md:text-base md:leading-6"
      >
        {label}
      </span>
    </div>
  );
}

/**
 * 두 톤 제목: 앞줄 fg-3 + 뒷줄 fg. 글자 단계는 모바일 h3(28px) · md 이상 h1(48px), 굵기 800(토큰).
 * 리드는 block 으로 줄을 바꾼다(<br> 없이, ux-rules T18).
 */
export function TwoToneHeading({
  as: Tag = "h2",
  lead,
  animate,
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3";
  lead?: ReactNode;
  animate?: AnimateKind;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-animate={animate} className={cx("text-h3 text-fg md:text-h1", className)}>
      {lead ? (
        <>
          <span className="block text-fg-3">{lead}</span>{" "}
        </>
      ) : null}
      {children}
    </Tag>
  );
}
