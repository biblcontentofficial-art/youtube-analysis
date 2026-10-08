"use client";

/**
 * 모바일·태블릿 하단 고정 CTA 바. 스크롤하는 동안 화면 아래에 붙어 있다(sticky).
 * 근거: docs/ux-renewal/ROADMAP.md R05 · ux-rules 1장 (다)(모바일 하단 고정 CTA 1개, landing#1·#14)
 *
 *   <BottomCTABar hideFrom="md">
 *     <a href="#apply" className={buttonClass({ size: "lg", block: true })}>지원하기</a>
 *   </BottomCTABar>
 *
 * - hideFrom: 이 폭부터 바를 숨긴다. "md"(768px) · "nav"(데스크톱 한 줄 메뉴, globals.css --breakpoint-nav).
 * - data-bottom-bar 에 같은 값이 들어가고, globals.css 가 바가 보이는 폭에서 카카오 버튼을 바 위로 올린다.
 * - hideWhenVisible: 페이지 안 주 CTA 의 선택자. 그 버튼이 화면에 보이는 동안 바를 숨겨 흰 버튼이 한 화면에 둘 뜨지 않게 한다.
 *   '보인다'는 버튼의 절반 이상이 화면 위에 붙은 전역 네비 아래로 드러난 상태다. 네비 밑에 깔린 버튼은 보이지 않는 것으로 센다.
 *   숨길 때는 자리를 둔 채 보이지 않게만 해서(visibility) 나타나고 사라질 때 내용이 밀리지 않는다.
 * - sticky 라 부모(main)의 맨 끝에 둔다. 층은 z-30(전역 네비·카카오 버튼 아래).
 * - sticky 는 화면보다 긴 페이지에서만 화면 아래에 붙는다. 짧은 페이지에서는 내용 바로 뒤에 놓이므로,
 *   그런 화면에 쓰면 부모를 "flex min-h-dvh flex-col" 로 두고 className 에 "mt-auto" 를 넘긴다.
 * - 안쪽 폭은 max-w-md 로 묶어 태블릿에서 흰 버튼이 화면 전체로 늘어나지 않게 한다.
 */
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "./button";

export type BottomBarBreakpoint = "md" | "nav";

const HIDE_FROM: Record<BottomBarBreakpoint, string> = {
  md: "md:hidden",
  nav: "nav:hidden",
};

const BAR =
  "sticky bottom-0 z-30 border-t border-line bg-canvas px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]";

/** 화면 위에 붙어 내용을 가리는 전역 네비(루트 레이아웃의 body > nav). R06c 에서 --nav-h 가 생기면 그 값으로 바꾼다 */
const STICKY_HEADER = "body > nav, body > header";

/** 전역 네비가 화면 위에서 가리는 높이(px). 붙어 있을 때의 아래 끝(top + 높이)이라 스크롤 위치와 상관없다 */
function stickyHeaderInset(header: HTMLElement | null): number {
  if (!header) return 0;
  const style = getComputedStyle(header);
  if (style.position !== "sticky" && style.position !== "fixed") return 0;
  return Math.max(0, Math.round((parseFloat(style.top) || 0) + header.getBoundingClientRect().height));
}

export function BottomCTABar({
  hideFrom,
  hideWhenVisible,
  className,
  children,
}: {
  hideFrom: BottomBarBreakpoint;
  /** 이 선택자에 맞는 요소가 하나라도 화면에 보이면(절반 이상, 네비 아래) 바를 숨긴다 */
  hideWhenVisible?: string;
  className?: string;
  children: ReactNode;
}) {
  // 선택자가 있으면 처음에는 숨겨 둔다(첫 화면에는 대개 페이지 안 CTA 가 보인다)
  const [covered, setCovered] = useState(Boolean(hideWhenVisible));

  useEffect(() => {
    if (!hideWhenVisible) return;
    const targets = Array.from(document.querySelectorAll(hideWhenVisible));
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") {
      setCovered(false);
      return;
    }
    const header = document.querySelector<HTMLElement>(STICKY_HEADER);
    const visible = new Set<Element>();
    let observer: IntersectionObserver | null = null;
    let inset = -1;

    // 관찰 영역 = 화면에서 네비가 가리는 위쪽을 뺀 부분. 네비 높이가 바뀌면(폭 변경·글꼴 로드) 다시 잡는다
    const connect = () => {
      const next = stickyHeaderInset(header);
      if (next === inset) return;
      inset = next;
      observer?.disconnect();
      visible.clear();
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // 절반 넘게 네비 밑이나 화면 밖에 있으면 누를 수 없으므로 보이지 않는 것으로 센다
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) visible.add(entry.target);
            else visible.delete(entry.target);
          }
          setCovered(visible.size > 0);
        },
        { rootMargin: `-${inset}px 0px 0px 0px`, threshold: 0.5 },
      );
      targets.forEach((target) => io.observe(target));
      observer = io;
    };

    connect();
    const resize = header && typeof ResizeObserver !== "undefined" ? new ResizeObserver(connect) : null;
    if (resize && header) resize.observe(header);
    else window.addEventListener("resize", connect);
    return () => {
      resize?.disconnect();
      window.removeEventListener("resize", connect);
      observer?.disconnect();
    };
  }, [hideWhenVisible]);

  return (
    <div
      data-bottom-bar={hideFrom}
      data-state={covered ? "hidden" : "shown"}
      className={cx(BAR, HIDE_FROM[hideFrom], covered && "invisible", className)}
    >
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
