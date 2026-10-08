"use client";

import { useEffect } from "react";

/**
 * 전역 네비(header#site-header)의 실제 높이를 html 의 --nav-h 에 적는다.
 * 페이지 안 sticky 요소(top-[var(--nav-h)])와 앵커 이동 여백(globals.css scroll-padding-top)이 이 값을 쓴다.
 * 값이 없을 때(첫 렌더·자바스크립트 꺼짐)는 globals.css 의 기본값(56px · 1280 이상 64px)이 쓰인다.
 */
export default function NavHeightObserver({ targetId = "site-header" }: { targetId?: string }) {
  useEffect(() => {
    const header = document.getElementById(targetId);
    if (!header) return;
    const root = document.documentElement;
    const write = () => {
      root.style.setProperty("--nav-h", `${Math.round(header.getBoundingClientRect().height)}px`);
    };
    write();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(write);
    ro.observe(header);
    return () => ro.disconnect();
  }, [targetId]);

  return null;
}
