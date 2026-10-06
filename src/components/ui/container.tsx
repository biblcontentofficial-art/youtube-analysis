/**
 * 가로 폭과 세로 여백. 네비·본문·푸터가 같은 좌우 기준선을 쓰게 한다(ux-rules T05).
 * 근거: docs/ux-renewal/ROADMAP.md R04 · 1.1 확정값(컨테이너 1200/672, 섹션 py-16 md:py-24)
 *
 *   <section className={SECTION}>
 *     <Container>…</Container>                 페이지 폭 1200px
 *   </section>
 *   <Container size="reading">…</Container>    글 폭 672px(약관·글 본문·폼·안내 화면)
 */
import type { ReactNode } from "react";
import { cx } from "./button";

export type ContainerSize = "page" | "reading";

/** Container 컴포넌트를 쓸 수 없는 곳(이미 있는 요소에 붙일 때)용 완성 문자열 */
export const CONTAINER: Record<ContainerSize, string> = {
  page: "mx-auto w-full max-w-page px-4 md:px-6",
  reading: "mx-auto w-full max-w-reading px-4 md:px-6",
};

/** 랜딩 섹션 세로 여백 */
export const SECTION = "py-16 md:py-24";

/** 페이지 첫 섹션(히어로) */
export const SECTION_HERO = "pt-20 pb-16 md:pt-32 md:pb-24";

/** 앱·커뮤니티 화면 머리(제목 영역) */
export const APP_HEAD = "py-8 md:py-12";

type ContainerTag = "div" | "section" | "main" | "header" | "footer" | "article" | "nav";

export function Container({
  size = "page",
  as: Tag = "div",
  id,
  className,
  children,
}: {
  size?: ContainerSize;
  as?: ContainerTag;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={cx(CONTAINER[size], className)}>
      {children}
    </Tag>
  );
}
