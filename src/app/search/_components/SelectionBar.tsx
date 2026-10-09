"use client";

/**
 * 선택 바 · 결과 토스트 (DESIGN 6.25 · 6.13, 시안 design-final/silver/app.html 725~746행)
 *
 *   <SelectionBar count={checked.size} onClear={clear}>
 *     {(size) => <button className={size === "md" ? …h-9… : …h-11…} onClick={remove}>채널 제거</button>}
 *   </SelectionBar>
 *
 * - 고른 항목이 있어야 하는 동작만 담는다. 요금제 동작(채널 리포트·영상 수집)은 결과 머리에 늘 있다.
 * - 768 미만: 화면 아래 전체 폭 고정 바(data-selection-bar). 보이는 동안 카카오 상담 버튼을 숨긴다(globals.css).
 * - 768 이상: 화면 아래 가운데 떠 있는 막대.
 * - 선택이 0개면 둘 다 hidden.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui/button";
import { CloseIcon, WarningIcon } from "@/components/ui/icons";

type BarSize = "sm" | "md";

/**
 * 버튼 모양에서 크기만 뺀 것(DESIGN 6.5 보조·고스트). buttonClass 는 크기 클래스(h-·px-·text-)를 늘 넣어서
 * 다른 높이·여백을 덧붙이면 같은 속성 클래스가 겹친다(cx 는 병합하지 않는다). 높이·여백·글자 크기는 쓰는 곳에서 붙인다.
 */
export const BTN_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40";
export const BTN_SECONDARY = cx(
  BTN_BASE,
  "border border-line-strong bg-surface font-semibold text-fg hover:border-line-hover hover:bg-surface-2",
);
export const BTN_GHOST = cx(BTN_BASE, "font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg");

export function SelectionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  /** 바 크기에 맞는 동작 버튼을 그린다. 모바일 바("sm" = 44px 버튼)와 떠 있는 막대("md" = 36px 버튼) 두 번 불린다 */
  children: (size: BarSize) => ReactNode;
}) {
  const hidden = count === 0;
  return (
    <>
      <div
        data-selection-bar
        hidden={hidden}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
      >
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            aria-label="선택 해제"
            className={cx(BTN_GHOST, "size-11 shrink-0")}
          >
            <CloseIcon size={20} />
          </button>
          <p className="tnum text-body-sm font-semibold text-fg" aria-live="polite">
            {count}개 선택
          </p>
          <div className="ml-auto flex items-center gap-2">{children("sm")}</div>
        </div>
      </div>
      <div
        hidden={hidden}
        className="pointer-events-none fixed inset-x-0 bottom-6 z-30 hidden justify-center px-6 md:flex"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-card border border-line-strong bg-surface-2 p-1.5">
          <button
            type="button"
            onClick={onClear}
            aria-label="선택 해제"
            className={cx(BTN_GHOST, "size-9 shrink-0 pointer-coarse:size-11")}
          >
            <CloseIcon size={16} />
          </button>
          <p className="tnum px-1.5 text-body-sm font-semibold text-fg">{count}개 선택</p>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-line-strong" />
          {children("md")}
        </div>
      </div>
    </>
  );
}

/** 선택 바 안 보조 버튼 크기(모바일 44px · 떠 있는 막대 36px, 터치 기기 44px) */
export function selectionActionClass(size: BarSize): string {
  return size === "sm"
    ? cx(BTN_SECONDARY, "h-11 shrink-0 px-4 text-body-sm")
    : cx(BTN_SECONDARY, "h-9 shrink-0 px-3 text-body-sm pointer-coarse:h-11");
}

export type ToastData = {
  /** 바뀔 때마다 새 토스트로 본다(같은 문장이 다시 떠도 5초를 새로 센다) */
  id: number;
  message: ReactNode;
  tone?: "default" | "error";
  /** 되돌리기 · 다시 시도 · 보기 같은 동작 하나 */
  action?: { label: string; onClick?: () => void; href?: string };
};

/**
 * 결과 토스트(DESIGN 6.13). role=status, 5초 뒤 사라진다. 동작 버튼에 포커스가 있거나 마우스가 올라가 있으면 멈춘다.
 * 모바일은 카카오 버튼 위(bottom-24), 768 이상은 아래 가운데. raised 면 떠 있는 선택 막대 위로 올린다.
 * 실패 토스트는 문장 앞 negative 기호만 색(면은 그대로).
 */
export function ActionToast({
  toast,
  onDismiss,
  raised = false,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
  raised?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const dismissRef = useRef(onDismiss);
  // 렌더 중 ref 쓰기를 피한다(React 19 규칙). 타이머는 effect 이후에만 돌므로 최신 함수를 읽는다
  useLayoutEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!toast || paused) return;
    const t = setTimeout(() => dismissRef.current(), 5000);
    return () => clearTimeout(t);
  }, [toast, paused]);

  // 새 토스트가 뜨면 멈춤 상태를 푼다
  useEffect(() => {
    setPaused(false);
  }, [toast?.id]);

  // 고스트 글자(fg-2)를 fg 로 올린 동작 버튼. 색 클래스가 겹치지 않게 BTN_BASE 에서 만든다
  const ACTION = cx(BTN_BASE, "h-11 shrink-0 px-3 text-body-sm font-semibold text-fg hover:bg-surface-3");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "fixed inset-x-4 z-70 mx-auto max-w-md",
        raised ? "bottom-28 md:bottom-24" : "bottom-24 md:bottom-6",
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {toast && (
        <div
          key={toast.id}
          data-toast-tone={toast.tone ?? "default"}
          className="flex items-center gap-3 rounded-card border border-line-strong bg-surface-2 py-1.5 pl-4 pr-1.5"
        >
          {toast.tone === "error" && <WarningIcon size={16} className="shrink-0 text-negative" />}
          <p className="min-w-0 flex-1 py-2.5 text-body-sm text-fg">{toast.message}</p>
          {toast.action &&
            (toast.action.href ? (
              <a href={toast.action.href} className={ACTION}>
                {toast.action.label}
              </a>
            ) : (
              <button
                type="button"
                className={ACTION}
                onClick={() => {
                  toast.action?.onClick?.();
                }}
              >
                {toast.action.label}
              </button>
            ))}
          {!toast.action && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="알림 닫기"
              className={cx(BTN_BASE, "size-11 shrink-0 text-fg-3 hover:bg-surface-3 hover:text-fg")}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
