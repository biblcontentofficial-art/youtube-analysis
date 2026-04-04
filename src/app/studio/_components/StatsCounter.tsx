"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  end: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { end: 65, suffix: "만+", label: "총 구독자" },
  { end: 7,  suffix: "개",  label: "운영·공동기획 채널" },
  { end: 100000000, suffix: "회+", label: "누적 조회수" },
];

function useCountUp(end: number, duration = 1800, started: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return count;
}

function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(stat.end, 1800, started);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isLarge = stat.end >= 1_000_000;

  return (
    <div ref={ref} className="flex flex-col items-center text-center flex-1 min-w-[160px]">
      {/* 숫자 */}
      <div className={`${isLarge ? "text-4xl md:text-5xl lg:text-[3.25rem]" : "text-6xl md:text-7xl lg:text-8xl"} font-black tracking-tight stat-num leading-none whitespace-nowrap`}>
        <span className="text-white">{count.toLocaleString("ko-KR")}</span>
        <span
          className="text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(135deg, #14b8a6, #06b6d4)" }}
        >
          {stat.suffix}
        </span>
      </div>
      {/* 레이블 */}
      <div className="mt-3 text-sm md:text-base text-gray-400 font-medium tracking-wide">
        {stat.label}
      </div>
    </div>
  );
}

export default function StatsCounter() {
  return (
    <div className="mt-20 pt-12 border-t border-gray-800">
      <div className="flex flex-wrap justify-center gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        {STATS.map((s) => (
          <Counter key={s.label} stat={s} />
        ))}
      </div>
    </div>
  );
}
