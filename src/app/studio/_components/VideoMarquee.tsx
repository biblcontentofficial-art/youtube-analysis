"use client";

/**
 * /studio CONTENTS 영상 썸네일 마퀴(두 줄, 반대 방향).
 * - 화면에 보일 때만 rAF 를 돌린다(IntersectionObserver). 트랙 폭은 마운트·크기 변화 때만 잰다(ResizeObserver).
 * - 이어 붙인 복제본 2벌은 aria-hidden + 링크 tabIndex=-1. 키보드 정지점은 첫 벌(줄당 12개)뿐이다.
 * - 마우스 올림·키보드 포커스·터치 때 멈추고, '일시정지/재생' 글자 버튼으로 직접 멈출 수 있다(ux-rules H24).
 * - prefers-reduced-motion 이면 처음부터 멈춰 있다.
 * - 삭제된 영상의 썸네일(YouTube 는 120×90 회색 그림을 200 으로 준다)은 카드째 숨긴다.
 * 금지 패턴 정리: 색 면 폴백(틸·시안) → surface-2, 빨간 원형 재생 아이콘 → 맨 삼각형, 확대·그림자·블러 없음.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// ── 숏폼 제외, 일반 영상만 / 4개 채널 랜덤 믹싱 (고정 셔플, 같은 채널 연속 방지) ──
const VIDEOS = [
  { id: "Bnp0HyZXOAk", channel: "비블 bibl" },
  { id: "l0IYxd-7mss", channel: "세계유명 골프정보" },
  { id: "-jWdORm55Kc", channel: "영어 키위새" },
  { id: "mxEU4Ui9RBo", channel: "비블 bibl" },
  { id: "_5ELU7Bx_J4", channel: "스윔클래스" },
  { id: "iIKbXHA3nJU", channel: "세계유명 골프정보" },
  { id: "QH03aawbDXE", channel: "비블 bibl" },
  { id: "vQo0-YChg6o", channel: "영어 키위새" },
  { id: "ZZ4_kNOd5Bg", channel: "세계유명 골프정보" },
  { id: "ouwAdBTIJwA", channel: "스윔클래스" },
  { id: "N_816X7TFRU", channel: "비블 bibl" },
  { id: "7_7Lmix_BZw", channel: "영어 키위새" },
  { id: "76mUJQrKsSY", channel: "세계유명 골프정보" },
  { id: "OIDdJAKnOhs", channel: "비블 bibl" },
  { id: "vSzQTivGf34", channel: "스윔클래스" },
  { id: "JHeJYy_A0aw", channel: "영어 키위새" },
  { id: "Y2s_QBuaZFk", channel: "세계유명 골프정보" },
  { id: "QvlqpiaFJEw", channel: "비블 bibl" },
  { id: "Eni8cn5T1VU", channel: "영어 키위새" },
  { id: "yaw140V8dcM", channel: "스윔클래스" },
  { id: "D_dsbn0qFM4", channel: "세계유명 골프정보" },
  { id: "0pyLmSNThh4", channel: "비블 bibl" },
  { id: "4F2kGFDUo5M", channel: "영어 키위새" },
  { id: "kcyaIQXNpII", channel: "세계유명 골프정보" },
];

type Video = (typeof VIDEOS)[number];

// 두 행으로 분배
const ROW1 = VIDEOS.filter((_, i) => i % 2 === 0);
const ROW2 = VIDEOS.filter((_, i) => i % 2 !== 0);

/** YouTube 가 삭제·비공개 영상에 주는 회색 그림은 120×90 이다 */
const isPlaceholder = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && img.naturalWidth <= 120;

function ThumbCard({ video, clone }: { video: Video; clone: boolean }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);

  // 하이드레이션 전에 다 받은 그림은 onLoad 를 놓치므로 한 번 더 본다
  useEffect(() => {
    const img = imgRef.current;
    if (img && isPlaceholder(img)) setMissing(true);
  }, []);

  if (missing) return null;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={clone ? -1 : undefined}
      className="group relative mr-4 block aspect-video w-72 shrink-0 overflow-hidden rounded-control bg-surface-2 outline-offset-[-2px] md:w-80 lg:w-96"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        alt={`${video.channel} 영상`}
        width={480}
        height={360}
        className="size-full object-cover"
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          if (isPlaceholder(e.currentTarget)) setMissing(true);
        }}
        onError={(e) => {
          const el = e.currentTarget;
          if (!el.src.includes("mqdefault")) el.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
          else setMissing(true);
        }}
      />
      {/* hover·포커스 때만 단색 막 + 맨 재생 삼각형 */}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-canvas/0 text-fg opacity-0 transition-colors duration-150 group-hover:bg-canvas/40 group-hover:opacity-100 group-focus-visible:bg-canvas/40 group-focus-visible:opacity-100"
      >
        <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor">
          <path d="M7 4.5v15l12-7.5-12-7.5z" />
        </svg>
      </span>
      {/* 채널 배지 */}
      <span className="absolute bottom-2 left-2 rounded bg-canvas/80 px-1.5 py-0.5 text-micro font-semibold text-fg-1">
        {video.channel}
      </span>
      <span className="sr-only"> (새 창)</span>
    </a>
  );
}

/**
 * rAF 마퀴. 속도를 목표값으로 부드럽게 보간해 멈출 때 서서히 감속한다.
 * running=false 면 루프 자체를 멈춘다(화면 밖). paused=true 면 감속해 멈춘 뒤 루프를 끝낸다.
 */
function MarqueeRow({
  videos,
  reverse = false,
  paused,
  running,
  speed = 38,
}: {
  videos: Video[];
  reverse?: boolean;
  paused: boolean;
  running: boolean;
  speed?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const oneThirdRef = useRef(0);
  const offsetRef = useRef(0);
  const velRef = useRef(0);
  // 현재 오프셋을 트랙에 적용한다(루프가 멈춘 동안 폭이 바뀌어도 위치가 맞도록 measure 에서도 부른다)
  const applyRef = useRef(() => {
    const track = trackRef.current;
    const oneThird = oneThirdRef.current;
    if (!track || oneThird <= 0) return;
    const tx = reverse ? -(oneThird - offsetRef.current) : -offsetRef.current;
    track.style.transform = `translateX(${tx}px)`;
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // 트랙 폭은 마운트·크기 변화(카드 숨김·화면 폭 변경) 때만 잰다. 카드마다 오른쪽 여백이라 3등분이 정확하다
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      oneThirdRef.current = track.scrollWidth / 3;
      if (oneThirdRef.current > 0) offsetRef.current %= oneThirdRef.current;
      applyRef.current();
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  // 보이는 동안만 돈다. 멈춤(사용자·hover·움직임 줄이기)으로 속도가 0 이 되면 루프를 끝내고, 다시 움직일 때 새로 시작한다
  useEffect(() => {
    if (!running) return;
    if (paused && velRef.current === 0) return;
    let rafId = 0;
    const tick = () => {
      const oneThird = oneThirdRef.current;
      if (oneThird > 0) {
        const baseVel = oneThird / (speed * 60); // 목표 속도 (px/frame @ 60fps)
        const targetVel = pausedRef.current ? 0 : baseVel;
        velRef.current += (targetVel - velRef.current) * 0.07;
        // 멈추는 중 속도가 아주 작아지면 0 으로 끊는다(소수점 이동이 끝없이 이어지지 않게)
        if (targetVel === 0 && Math.abs(velRef.current) < 0.01) velRef.current = 0;
        offsetRef.current += velRef.current;
        if (offsetRef.current >= oneThird) offsetRef.current -= oneThird;
        applyRef.current();
      }
      if (pausedRef.current && velRef.current === 0) return; // 완전히 멈췄으면 다음 프레임을 예약하지 않는다
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running, paused, speed]);

  return (
    <div className="w-full overflow-hidden">
      <div ref={trackRef} className="flex w-max">
        {[0, 1, 2].map((copy) => (
          <div key={copy} aria-hidden={copy > 0 ? true : undefined} className="flex">
            {videos.map((v) => (
              <ThumbCard key={v.id} video={v} clone={copy > 0} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VideoMarquee() {
  const rootRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<number | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // 움직임 줄이기 설정이면 멈춘 채로 시작한다
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setUserPaused(true);
  }, []);

  // 화면에 보일 때만 움직인다
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(touchTimer.current), []);

  const onTouchStart = useCallback(() => {
    window.clearTimeout(touchTimer.current);
    setTouched(true);
  }, []);
  const onTouchEnd = useCallback(() => {
    window.clearTimeout(touchTimer.current);
    touchTimer.current = window.setTimeout(() => setTouched(false), 2500);
  }, []);

  const paused = userPaused || hover || focused || touched;

  return (
    <div ref={rootRef}>
      <div className="mx-auto mb-6 flex max-w-wide items-center justify-between gap-4 px-6 lg:px-8">
        <p className="hidden text-caption text-fg-3 md:block">마우스를 올리면 멈춥니다 · 클릭하면 유튜브로 이동합니다</p>
        <button
          type="button"
          onClick={() => setUserPaused((v) => !v)}
          className="-mx-3 inline-flex h-11 items-center rounded-md px-3 text-body-sm font-semibold text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg md:mx-0 md:ml-auto"
        >
          {userPaused ? "재생" : "일시정지"}
        </button>
      </div>
      <div
        className="w-full space-y-4"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <MarqueeRow videos={ROW1} paused={paused} running={visible} speed={42} />
        <MarqueeRow videos={ROW2} reverse paused={paused} running={visible} speed={38} />
      </div>
    </div>
  );
}
