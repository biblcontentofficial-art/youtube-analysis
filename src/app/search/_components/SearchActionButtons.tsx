"use client";

import type { ReactNode } from "react";
import { buttonClass, cx } from "@/components/ui/button";

/**
 * 결과 툴바의 동작 버튼(채널 리포트·영상 수집·채널 제거). 누르면 SearchResultList 가 듣는 창 이벤트만 보낸다.
 * 모양: 보조 버튼 sm(36px, 터치 기기 44px, DESIGN 6.5). 640 미만은 짧은 라벨(버튼 이름은 aria-label 로 전체 라벨).
 */
interface ActionButtonProps {
  label: string;
  /** 640 미만에서 보이는 짧은 라벨 */
  shortLabel?: string;
  /** 맨 SVG 아이콘(components/ui/icons). 이모지 금지 */
  icon?: ReactNode;
  event?: string;
}

const ACTION_BUTTON = cx(buttonClass({ variant: "secondary", size: "sm" }), "pointer-coarse:h-11");

export function ActionButton({ label, shortLabel, icon, event }: ActionButtonProps) {
  const handleClick = () => {
    if (event) window.dispatchEvent(new Event(event));
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={shortLabel ? label : undefined}
      className={ACTION_BUTTON}
    >
      {icon}
      {shortLabel ? (
        <>
          <span aria-hidden="true" className="sm:hidden">{shortLabel}</span>
          <span aria-hidden="true" className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
