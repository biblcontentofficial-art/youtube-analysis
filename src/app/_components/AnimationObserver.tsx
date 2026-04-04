"use client";

import { useEffect } from "react";

/**
 * 뷰포트에 진입하는 [data-animate] 요소에 "in-view" 클래스를 추가합니다.
 * data-delay="300" 처럼 ms 단위 지연을 줄 수 있습니다.
 */
export default function AnimationObserver() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-animate]");

    const trigger = (el: HTMLElement) => {
      const delay = Number(el.dataset.delay ?? 0);
      setTimeout(() => el.classList.add("in-view"), delay);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          trigger(entry.target as HTMLElement);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (inViewport) {
        trigger(el);
      } else {
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);

  return null;
}
