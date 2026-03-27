"use client";

import { useEffect, useRef, useState } from "react";

/* ── Count-up hook (easeOutExpo) ───────────────────────────── */
function useCountUp(end: number, duration = 2000, started: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return count;
}

/* ── 숫자 카운트업 아이템 ───────────────────────────────────── */
function CountItem({
  end,
  suffix,
  label,
  delay = 0,
}: {
  end: number;
  suffix?: string;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const count = useCountUp(end, 2000, started);

  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl font-bold text-teal-400 tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/* ── 텍스트 fade+scale 인 아이템 ───────────────────────────── */
function TextItem({
  text,
  label,
  delay = 0,
}: {
  text: string;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="text-center">
      <p
        className="text-2xl font-bold text-teal-400 transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.85)",
        }}
      >
        {text}
      </p>
      <p
        className="text-xs text-gray-500 mt-1 transition-all duration-700 delay-150"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {label}
      </p>
    </div>
  );
}

/* ── 메인 컴포넌트 ─────────────────────────────────────────── */
export default function LandingStats() {
  return (
    <div className="border-y border-gray-800 bg-gray-900/50 py-6">
      <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
        <CountItem end={10000} suffix="+" label="키워드 분석됨" delay={0} />
        <TextItem text="실시간" label="YouTube 데이터 수집" delay={150} />
        <TextItem text="무료" label="로그인 후 무료 2회 가능" delay={300} />
      </div>
    </div>
  );
}
