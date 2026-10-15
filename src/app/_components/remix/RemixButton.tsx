"use client";
/**
 * B5 기획 초안 여는 버튼(클라이언트 잎). 근거: docs/trend-dev/spec.md 3.5 · roadmap T7
 *
 *   <RemixButton video={v} variant="ghost" label="기획 초안" className="h-9 px-3 text-body-sm" />
 *
 * - RemixProvider(또는 VideoModal) 안이면 그 대화상자를 연다. 밖이면 자기 대화상자를 연다.
 *   VideoModal 처럼 같은 대화상자 안 내용만 바꾸는 곳(host.inline)에서는 aria-haspopup 을 달지 않는다.
 * - 크기(높이·여백·글자)는 쓰는 곳에서 className 으로 붙인다(BTN_* 는 크기를 넣지 않는다).
 * - Free 도 버튼은 보인다. 누르면 대화상자 안에서 요금제 안내가 나온다(횟수 차감 없음).
 */
import { useState } from "react";
import { cx } from "@/components/ui/button";
import { BTN_GHOST, BTN_SECONDARY } from "@/app/search/_components/SelectionBar";
import type { RemixVideo } from "@/lib/trend/remix-schema";
import { useRemixHost } from "./RemixProvider";
import { RemixDialog } from "./RemixDialog";

export function RemixButton({
  video,
  variant = "secondary",
  label = "이 영상처럼 기획하기",
  ariaLabel,
  className,
}: {
  video: RemixVideo;
  variant?: "secondary" | "ghost";
  label?: string;
  /** 표 행처럼 같은 글자 버튼이 여럿일 때 영상 제목을 붙인 이름 */
  ariaLabel?: string;
  className?: string;
}) {
  const host = useRemixHost();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-remix-button=""
        aria-haspopup={host?.inline ? undefined : "dialog"}
        aria-label={ariaLabel}
        onClick={() => (host ? host.open(video) : setOpen(true))}
        className={cx(variant === "secondary" ? BTN_SECONDARY : BTN_GHOST, className)}
      >
        {label}
      </button>
      {!host && open && <RemixDialog video={video} onClose={() => setOpen(false)} />}
    </>
  );
}
