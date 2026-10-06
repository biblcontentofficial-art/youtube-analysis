"use client";

import { useEffect } from "react";

/**
 * 뷰포트에 진입하는 [data-animate] 요소에 "in-view" 클래스를 추가합니다.
 * data-delay="300" 처럼 ms 단위 지연을 줄 수 있습니다.
 *
 * 숨김(globals.css)은 html[data-motion="ready"] 아래에서만 걸리므로 JS 가 늦거나 실패해도 내용이 보입니다.
 * 마운트 때 이미 화면 안에 있는 요소는 준비 표시를 달기 전에 바로 in-view 처리해 깜빡이지 않게 하고,
 * 움직임 줄이기 설정이면 모든 요소를 바로 보여 줍니다.
 */
export default function AnimationObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));
    const show = (el: HTMLElement) => el.classList.add("in-view");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      elements.forEach(show);
      return;
    }

    // 첫 화면 안 요소는 지연 없이 먼저 보이게 한 뒤 준비 표시를 단다
    const pending: HTMLElement[] = [];
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) show(el);
      else pending.push(el);
    });
    root.setAttribute("data-motion", "ready");

    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          const delay = Number(el.dataset.delay ?? 0);
          if (delay > 0) timers.push(window.setTimeout(() => show(el), delay));
          else show(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    pending.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      // 다른 화면으로 옮겼다가 다시 들어올 때 첫 화면 요소가 숨지 않도록 준비 표시를 지운다
      root.removeAttribute("data-motion");
    };
  }, []);

  return null;
}
