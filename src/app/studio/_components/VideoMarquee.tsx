"use client";

import { useEffect, useRef, useState } from "react";

// ── 숏폼 제외, 일반 영상만 / 채널 라운드로빈 믹싱 ──
const VIDEOS = [
  { id: "l0IYxd-7mss",   channel: "세계유명 골프정보", color: "#14532d" },
  { id: "kcyaIQXNpII",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "_5ELU7Bx_J4",   channel: "스윔클래스",        color: "#164e63" },
  { id: "-jWdORm55Kc",   channel: "영어 키위새",        color: "#1e3a5f" },
  { id: "iIKbXHA3nJU",   channel: "세계유명 골프정보", color: "#14532d" },
  { id: "vj6DQsMqH5A",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "ouwAdBTIJwA",   channel: "스윔클래스",        color: "#164e63" },
  { id: "vQo0-YChg6o",   channel: "영어 키위새",        color: "#1e3a5f" },
  { id: "ZZ4_kNOd5Bg",   channel: "세계유명 골프정보", color: "#14532d" },
  { id: "Jp59Z7wiOaI",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "vSzQTivGf34",   channel: "스윔클래스",        color: "#164e63" },
  { id: "7_7Lmix_BZw",   channel: "영어 키위새",        color: "#1e3a5f" },
  { id: "76mUJQrKsSY",   channel: "세계유명 골프정보", color: "#14532d" },
  { id: "xXwgbvPo7yU",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "yaw140V8dcM",   channel: "스윔클래스",        color: "#164e63" },
  { id: "JHeJYy_A0aw",   channel: "영어 키위새",        color: "#1e3a5f" },
  { id: "Y2s_QBuaZFk",   channel: "세계유명 골프정보", color: "#14532d" },
  { id: "Z7Z9m0h9IsI",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "Eni8cn5T1VU",   channel: "영어 키위새",        color: "#1e3a5f" },
  { id: "D_dsbn0qFM4",   channel: "세계유명 골프정보", color: "#14532d" },
  { id: "VbCvgL-ZvxI",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "4F2kGFDUo5M",   channel: "영어 키위새",        color: "#1e3a5f" },
  { id: "nKonn6YGM9A",   channel: "비블 bibl",         color: "#134e4a" },
  { id: "ZczdkpjTpXo",   channel: "영어 키위새",        color: "#1e3a5f" },
];

// 두 행으로 분배
const ROW1 = VIDEOS.filter((_, i) => i % 2 === 0);
const ROW2 = VIDEOS.filter((_, i) => i % 2 !== 0);

function ThumbCard({ video }: { video: (typeof VIDEOS)[0] }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative shrink-0 w-72 md:w-80 lg:w-96 rounded-2xl overflow-hidden group"
      style={{ aspectRatio: "16/9", background: video.color }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        alt={video.channel}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget;
          if (!el.src.includes("mqdefault")) {
            el.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
          }
        }}
      />
      {/* 다크 오버레이 */}
      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
      {/* 플레이 버튼 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-200">
          <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </div>
      </div>
      {/* 채널 배지 */}
      <div className="absolute bottom-2 left-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white/90 backdrop-blur-sm"
          style={{ backgroundColor: video.color + "cc" }}
        >
          {video.channel}
        </span>
      </div>
    </a>
  );
}

/**
 * rAF 기반 마퀴 – velocity lerp 으로 스무스하게 감속/가속
 * paused=true 시 목표 속도를 0으로 설정 → 서서히 감속해 멈춤
 */
function MarqueeRow({
  videos,
  reverse = false,
  paused,
  speed = 38,
}: {
  videos: (typeof VIDEOS)[0][];
  reverse?: boolean;
  paused: boolean;
  speed?: number;
}) {
  const items = [...videos, ...videos, ...videos];
  const trackRef = useRef<HTMLDivElement>(null);

  // pausedRef: effect 재실행 없이 최신 paused 값 읽기
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // offset: 항상 양수, 0 ~ oneThird 범위
    let offset = 0;
    let vel = 0;       // 현재 속도 (px/frame)
    let rafId: number;

    const tick = () => {
      const oneThird = track.scrollWidth / 3;
      if (oneThird <= 0) { rafId = requestAnimationFrame(tick); return; }

      const baseVel = oneThird / (speed * 60); // 목표 속도 (px/frame @ 60fps)
      const targetVel = pausedRef.current ? 0 : baseVel;

      // velocity를 목표값으로 부드럽게 보간 (감속 계수 0.07 ≈ ~0.4초 내 정지)
      vel += (targetVel - vel) * 0.07;

      offset += vel;
      if (offset >= oneThird) offset -= oneThird;

      // forward: 왼쪽으로 이동 → translateX(-offset)
      // reverse: 오른쪽으로 이동 → translateX(-(oneThird - offset))
      const tx = reverse ? -(oneThird - offset) : -offset;
      track.style.transform = `translateX(${tx}px)`;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reverse, speed]); // paused 변경은 ref로 처리 → effect 재시작 없음

  return (
    <div className="overflow-hidden w-full">
      <div ref={trackRef} className="flex gap-4 w-max">
        {items.map((v, i) => (
          <ThumbCard key={`${v.id}-${i}`} video={v} />
        ))}
      </div>
    </div>
  );
}

export default function VideoMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="w-full space-y-4 py-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <MarqueeRow videos={ROW1} reverse={false} paused={paused} speed={42} />
      <MarqueeRow videos={ROW2} reverse={true}  paused={paused} speed={38} />
    </div>
  );
}
