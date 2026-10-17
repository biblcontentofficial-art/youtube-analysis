"use client";

/**
 * 숫자 한 번 세기(홈 은은한 모션 A, 소유자 결정 2026-10-17). LandingStats 방식을 한 숫자 단위로 뺀 부품.
 * - 서버 HTML 은 처음부터 최종값이다. JS 가 없거나 늦어도, 움직임 줄이기 설정이어도 최종값 그대로 보인다.
 * - 화면에 들어오면 0.9초 동안 0 에서 최종값까지 한 번 센다(easeOutCubic). 다시 들어와도 세지 않는다.
 * - 최종값을 보이지 않게 같은 칸에 깔아 칸 폭을 고정한다. 세는 숫자는 앞을 숫자 폭 공백(U+2007, tnum 숫자와 같은 폭)으로 채워
 *   글자 수를 최종값과 맞춘다. 글자 시작점이 움직이지 않고 '만' 위치도 그대로라 레이아웃 이동이 생기지 않는다(CLS 0).
 * - 보이는 숫자는 장식(aria-hidden). 읽을 문장은 부르는 쪽이 둔다(sr-only 등).
 * value 는 '70만' · '26.3만' 처럼 숫자로 시작하는 문자열. 숫자로 시작하지 않으면 세지 않고 그대로 보인다.
 */
import { useEffect, useRef, useState } from "react";

const DURATION = 900;
const FIGURE_SPACE = "\u2007";

export default function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const final = match ? parseFloat(match[1]) : 0;
  const decimals = match ? (match[1].split(".")[1] ?? "").length : 0;
  // 1 = 최종값(서버 HTML 과 같다)
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || !/^\d/.test(value) || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setProgress(0);
        let start: number | null = null;
        const step = (t: number) => {
          if (start === null) start = t;
          const p = Math.min((t - start) / DURATION, 1);
          setProgress(1 - Math.pow(1 - p, 3));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const shown = !match || progress >= 1 ? value : `${(final * progress).toFixed(decimals).padStart(match[1].length, FIGURE_SPACE)}${match[2]}`;

  return (
    <span ref={ref} aria-hidden="true" className="inline-grid">
      <span className="invisible col-start-1 row-start-1">{value}</span>
      <span className="col-start-1 row-start-1">{shown}</span>
    </span>
  );
}
