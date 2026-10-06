/**
 * 섹션 헤더(소유자 확정 패턴): 좌측 한글 캡션 + 우측 영문 라벨 + 헤어라인, 그 아래 두 톤 제목.
 * /studio 의 SectionLabel 마크업을 옮기고 캡션 대비만 올렸다(neutral-500 → neutral-400).
 * 근거: docs/ux-renewal/ROADMAP.md R04 · spec/reference-design.md §4.4 "섹션 헤더"
 *
 *   <SectionHeader caption="비블의 유튜브 채널 대행" label="PROBLEM" />
 *   <TwoToneHeading lead="유튜브를 혼자 운영하면서">답답하지 않으셨나요?</TwoToneHeading>
 *
 * 방문 기록(TrackVisit) 같은 동작은 넣지 않는다. 라벨 수만큼 실행되므로 페이지에서 한 번만 둔다.
 */
import type { ReactNode } from "react";
import { cx } from "./button";

/** globals.css 의 스크롤 등장 종류(AnimationObserver 가 있는 페이지에서만 움직인다) */
export type AnimateKind = "fade" | "up" | "left" | "right" | "scale";

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
        "mb-10 flex items-center justify-between gap-4 border-b border-neutral-800 pb-4 md:mb-12",
        className,
      )}
    >
      <span className="text-xs text-neutral-400 md:text-sm">{caption}</span>
      <span lang="en" aria-hidden="true" className="shrink-0 text-sm font-black tracking-[0.25em] text-white md:text-base">
        {label}
      </span>
    </div>
  );
}

/**
 * 두 톤 제목: 회색 리드 한 줄 + 흰 본문. 글자 단계는 모바일 h3(28px) · md 이상 h1(48px), 굵기 900.
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
    <Tag data-animate={animate} className={cx("text-h3 text-white md:text-h1", className)}>
      {lead ? (
        <>
          <span className="block text-neutral-400">{lead}</span>{" "}
        </>
      ) : null}
      {children}
    </Tag>
  );
}
