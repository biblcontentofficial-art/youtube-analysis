"use client";

/**
 * 첫 화면 실적 숫자(70만+ · 1.7억회+ · 10억원+). DESIGN 6.14 실적 열.
 * - 서버 HTML 은 처음부터 최종값이다('0+' 없음). 화면에 들어오면 0.8초 동안 0 에서 최종값까지 센다.
 * - prefers-reduced-motion 이면 세지 않는다. 숫자는 tabular-nums 라 세는 동안 자리 폭이 흔들리지 않는다.
 * - 보이는 숫자는 aria-hidden, 스크린 리더는 sr-only 문장(최종값)을 읽는다.
 * 숫자 출처: docs/ux-renewal/design-final/layout-F/rationale.md (BRIEF 확인 사실만, 새 수치 금지)
 */
import { useEffect, useRef, useState } from "react";

type Stat = {
  value: number;
  decimals: number;
  unit: string;
  /** 640 미만 라벨 */
  labelShort: string;
  /** 640 이상 라벨 */
  label: string;
  /** 스크린 리더 문장 */
  sr: string;
};

const STATS: Stat[] = [
  { value: 70, decimals: 0, unit: "만", labelShort: "총 구독자", label: "채널 총 구독자", sr: "70만 명 이상" },
  { value: 1.7, decimals: 1, unit: "억회", labelShort: "누적 조회수", label: "채널 누적 조회수", sr: "1.7억 회 이상" },
  { value: 10, decimals: 0, unit: "억원", labelShort: "유튜브 매출", label: "유튜브 매출", sr: "10억 원 이상" },
];

const DURATION = 800;

export default function LandingStats() {
  const ref = useRef<HTMLDListElement>(null);
  // 1 = 최종값(서버 HTML 과 같다). 화면에 들어올 때만 0 부터 다시 센다
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let start: number | null = null;
        const step = (t: number) => {
          if (start === null) start = t;
          const p = Math.min((t - start) / DURATION, 1);
          // easeOutCubic: 처음에 빠르고 끝에서 천천히 멈춘다
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
  }, []);

  return (
    <dl
      ref={ref}
      className="mt-3 grid grid-cols-[auto_auto_auto] justify-start gap-x-4 border-t border-line sm:grid-cols-3 sm:justify-normal lg:mt-5 lg:grid-cols-1 lg:divide-y lg:divide-line-soft"
    >
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col-reverse gap-1 pt-3 sm:gap-1.5 sm:pt-4 lg:py-4">
          <dt className="text-caption text-fg-3">
            <span className="sm:hidden">{s.labelShort}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </dt>
          <dd className="tnum text-[22px] font-extrabold leading-none tracking-[-0.03em] sm:text-[30px] lg:text-[32px] xl:text-[40px]">
            {/* 최종값을 보이지 않게 같은 칸에 깔아 둔다. 세는 동안 자릿수가 바뀌어도 칸 폭이 그대로라 옆 열이 밀리지 않는다 */}
            <span aria-hidden="true" className="grid">
              <span className="invisible col-start-1 row-start-1">
                {`${s.value.toFixed(s.decimals)}${s.unit}`}
                <span className="text-silver">+</span>
              </span>
              <span className="col-start-1 row-start-1">
                {`${(s.value * progress).toFixed(s.decimals)}${s.unit}`}
                <span className="text-silver">+</span>
              </span>
            </span>
            <span className="sr-only">{s.sr}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
