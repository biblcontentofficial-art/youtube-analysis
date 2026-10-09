"use client";

/**
 * /studio 첫 화면 아래 실적 숫자 3칸(DESIGN 6.14 실적 숫자).
 * - 서버 HTML 은 처음부터 최종값이다('0만+' 없음). 화면에 들어오면 0.8초 동안 0 에서 최종값까지 센다.
 * - prefers-reduced-motion 이면 세지 않는다. 숫자는 tabular-nums 라 세는 동안 자리 폭이 흔들리지 않는다.
 * - 모바일도 3칸 한 줄(grid-cols-3). 보이는 숫자는 aria-hidden, 스크린 리더는 sr-only 문장(최종값)을 읽는다.
 */
import { useEffect, useRef, useState } from "react";

interface Stat {
  end: number;
  unit: string;
  label: string;
  decimals: number;
  sr: string;
}

const STATS: Stat[] = [
  { end: 70, unit: "만", label: "총 구독자", decimals: 0, sr: "70만 명 이상" },
  { end: 1.7, unit: "억회", label: "누적 조회수", decimals: 1, sr: "1.7억 회 이상" },
  { end: 10, unit: "억원", label: "유튜브 매출", decimals: 0, sr: "10억 원 이상" },
];

const DURATION = 800;

export default function StatsCounter() {
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
          setProgress(1 - Math.pow(1 - p, 3));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
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
      className="mt-12 grid grid-cols-3 divide-x divide-line border-t border-line pt-8 lg:mt-16 lg:pt-10"
    >
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col-reverse items-center gap-1.5 px-2 text-center sm:gap-2">
          <dt className="text-caption text-fg-3 sm:text-body-sm">{s.label}</dt>
          <dd className="tnum whitespace-nowrap text-[22px] font-extrabold leading-none tracking-[-0.03em] sm:text-[30px] lg:text-[32px] xl:text-[40px]">
            {/* 최종값을 보이지 않게 같은 칸에 깔아 둔다. 세는 동안 자릿수가 바뀌어도 칸 폭이 그대로다 */}
            <span aria-hidden="true" className="grid">
              <span className="invisible col-start-1 row-start-1">
                {`${s.end.toFixed(s.decimals)}${s.unit}`}
                <span className="text-silver">+</span>
              </span>
              <span className="col-start-1 row-start-1">
                {`${(s.end * progress).toFixed(s.decimals)}${s.unit}`}
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
