"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 채널 아이콘 원본 URL(yt3) */
/**
 * 채널 아이콘(장식, alt 빈 값). yt3 아이콘은 가끔 요청 과다로 안 불러와진다.
 * 그럴 때 깨진 이미지 표시 대신 같은 크기의 빈 원(bg-surface-2)만 남긴다.
 * 표시 크기의 2배 해상도(sN)만 받는다.
 */
import { useEffect, useRef, useState } from "react";

const sized = (src: string, px: number) => src.replace(/=s\d+-/, `=s${px * 2}-`);

export default function ChannelAvatar({ src, size, className = "" }: { src: string; size: number; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // 하이드레이션 전에 실패한 경우는 onError 를 놓치므로 한 번 더 확인한다
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  const base = `shrink-0 rounded-full bg-surface-2 ${className}`;
  if (failed) return <span aria-hidden="true" className={`block ${base}`} />;
  return (
    <img
      ref={ref}
      src={sized(src, size)}
      alt=""
      width={size}
      height={size}
      className={`object-cover ${base}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
