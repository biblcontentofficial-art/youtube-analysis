"use client";

/**
 * 대화상자 셸. 네이티브 <dialog> 를 showModal() 로 연다(의존성 없음).
 * 근거: docs/ux-renewal/ROADMAP.md R05 · ux-rules 5.7·H02(제목·설명 연결, 포커스 가둠·복귀, Esc) · reference-design §4.4(모달)
 *
 *   import { DIALOG_ACTIONS, DIALOG_DESCRIPTION, DIALOG_TITLE } from "@/components/ui/dialog-classes";
 *
 *   const titleId = useId();
 *   <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
 *     <h2 id={titleId} className={DIALOG_TITLE}>제목</h2>
 *     <p className={DIALOG_DESCRIPTION}>설명</p>
 *     <div className={DIALOG_ACTIONS}>
 *       <button type="button" className={buttonClass({ variant: "secondary" })} onClick={() => setOpen(false)}>취소</button>
 *       <button type="button" data-autofocus className={buttonClass()} onClick={run}>확인</button>
 *     </div>
 *   </Dialog>
 *
 * - 브라우저 최상위 층(top layer)에 뜨므로 z-index 를 쓰지 않는다. 네비·카카오 버튼·토스트는 모두 배경 막 아래로 간다.
 * - 열면 data-autofocus 가 붙은 요소, 없으면 첫 번째 누를 수 있는 요소에 포커스한다.
 *   React 의 autoFocus 는 닫힌 dialog 안에서 실행돼 효과가 없으므로 쓰지 않는다.
 * - 닫으면 연 요소로 포커스가 돌아간다. 터치·펜으로 닫았고 연 요소가 입력칸이면 돌려주지 않는다(모바일 키보드가 다시 올라오지 않게).
 *   키보드·마우스로 닫으면 언제나 돌려준다.
 * - Tab·Shift+Tab 은 창 안에서만 돈다. Esc·바깥 클릭은 dismissible 일 때만 onClose 를 부른다.
 * - 열려 있는 동안 html 스크롤을 잠근다.
 * - 창을 연 키 입력은 창 안의 버튼을 누르지 않는다. keydown 에서 창을 열면 뒤따르는 Enter keypress 를, 누르고 있던 Enter 의
 *   자동 반복은 창 안에서 새 키를 누를 때까지 무시한다(확인 버튼이 저절로 눌리지 않게). 그 뒤의 자동 반복(입력칸 줄바꿈 등)은 그대로다.
 * - 배경 막 색은 리터럴 값이다(::backdrop 이 테마 변수를 상속하지 않는 Safari 17.3 이하 대비).
 * - showModal 이 없는 브라우저(Safari 15.3 이하·Firefox 97 이하)에서는 open 속성을 직접 달고, data-fallback 고정 배치(z-90)와
 *   별도 배경 막으로 띄운다. Esc 는 keydown 으로 받는다. 닫힌 dialog 는 globals.css 의 dialog:not([open]) 규칙이 모든 브라우저에서 숨긴다.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { cx } from "./button";

export type DialogPlacement = "center" | "sheet";

/** 패널 공통: neutral 면 + 1px 선, 그림자·블러 없음 */
const PANEL = "border border-neutral-800 bg-neutral-900 p-6 text-white backdrop:bg-[rgb(0_0_0/0.8)]";

/**
 * 위치. preflight 가 dialog 의 margin:auto 를 지우므로 여기서 다시 준다.
 * center: 가운데 상자(좌우 16px 이상 여백) · sheet: 모바일은 화면 아래에 붙는 전체 폭 시트, md 이상은 가운데 상자.
 */
const PLACEMENT: Record<DialogPlacement, string> = {
  center: "m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-panel",
  sheet:
    "mx-auto mt-auto mb-0 w-full max-w-none rounded-t-panel pb-[max(1.5rem,env(safe-area-inset-bottom))] md:m-auto md:w-[calc(100%_-_2rem)] md:max-w-sm md:rounded-panel md:pb-6",
};

/**
 * showModal 이 없는 브라우저용 배치. 셸이 data-fallback 을 직접 달 때만 적용된다.
 * 브라우저의 모달 배치(화면 고정 + 사방 0 + 크기는 내용만큼)를 따라 하고, 가운데·아래 정렬은 PLACEMENT 의 auto 여백이 맡는다.
 * 최상위 층이 없으므로 겹침 순서의 맨 위(z-80)보다 높은 z-90 에 둔다.
 */
const FALLBACK =
  "data-fallback:fixed data-fallback:inset-0 data-fallback:z-90 data-fallback:h-fit data-fallback:max-h-[calc(100%_-_2rem)] data-fallback:overflow-y-auto";
const FALLBACK_BACKDROP = "fixed inset-0 z-90 bg-[rgb(0_0_0/0.8)]";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,iframe,[contenteditable]:not([contenteditable="false"]),[tabindex]';

function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0,
  );
}

function focusInitial(dialog: HTMLDialogElement) {
  const target = dialog.querySelector<HTMLElement>("[data-autofocus]") ?? tabbables(dialog)[0] ?? dialog;
  target.focus();
}

/** 최상위 층으로 연다. showModal 이 없거나 실패하면 false(대체 배치로 연다) */
function openModal(dialog: HTMLDialogElement): boolean {
  if (typeof dialog.showModal !== "function") return false;
  try {
    if (!dialog.open) dialog.showModal();
    return true;
  } catch {
    return false;
  }
}

const NON_TEXT_INPUTS = ["button", "checkbox", "radio", "submit", "reset", "file", "image", "range", "color"];

function isTextEntry(el: HTMLElement) {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUTS.includes(el.type);
  return el.isContentEditable;
}

function isOutside(el: HTMLElement, x: number, y: number) {
  const r = el.getBoundingClientRect();
  return x < r.left || x > r.right || y < r.top || y > r.bottom;
}

type InputKind = "keyboard" | "mouse" | "touch";

/** 펜은 터치와 같이 센다(화면 키보드를 쓰는 기기) */
function pointerKind(e: PointerEvent<HTMLElement>): InputKind {
  return e.pointerType === "touch" || e.pointerType === "pen" ? "touch" : "mouse";
}

// 스크롤 잠금은 여러 창이 겹쳐 열려도 마지막 창이 닫힐 때 한 번만 푼다
let lockCount = 0;
let savedOverflow = "";
let savedGutter = "";

function lockScroll() {
  const html = document.documentElement;
  if (lockCount === 0) {
    savedOverflow = html.style.overflow;
    savedGutter = html.style.getPropertyValue("scrollbar-gutter");
    // 스크롤바가 있던 화면만 그 자리를 남겨 본문이 옆으로 밀리지 않게 한다
    if (window.innerWidth > html.clientWidth) html.style.setProperty("scrollbar-gutter", "stable");
    html.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockScroll() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;
  const html = document.documentElement;
  html.style.overflow = savedOverflow;
  if (savedGutter) html.style.setProperty("scrollbar-gutter", savedGutter);
  else html.style.removeProperty("scrollbar-gutter");
}

export function Dialog({
  open,
  onClose,
  dismissible = true,
  placement = "center",
  role = "dialog",
  labelledBy,
  describedBy,
  className,
  children,
}: {
  open: boolean;
  /** Esc·바깥 클릭(dismissible 일 때)과 브라우저가 스스로 창을 닫았을 때 부른다. 여기서 open 을 false 로 바꾼다 */
  onClose: () => void;
  /** false 면 Esc·바깥 클릭으로 닫히지 않는다(버튼으로만 고르는 창) */
  dismissible?: boolean;
  placement?: DialogPlacement;
  /** 확인·경고처럼 답을 받아야 하는 창은 alertdialog */
  role?: "dialog" | "alertdialog";
  /** 제목 요소의 id (aria-labelledby) */
  labelledBy?: string;
  /** 설명 요소의 id (aria-describedby) */
  describedBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const latest = useRef({ open, onClose, dismissible });
  const pressedOnBackdrop = useRef(false);
  const lastInput = useRef<InputKind>("keyboard");
  // 창 안에서 새 키를 누른 뒤에만 Enter 의 keypress(버튼 누름)와 자동 반복을 허용한다
  const keyArmed = useRef(false);
  // showModal 이 없는 브라우저에서 연 상태(별도 배경 막을 그린다)
  const [fallback, setFallback] = useState(false);

  useIsoLayoutEffect(() => {
    latest.current = { open, onClose, dismissible };
  });

  // 여는 효과보다 먼저 붙여, 창을 연 키 입력의 keypress 가 오기 전에 준비한다
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKeyPress = (e: Event) => {
      if (!keyArmed.current && (e as globalThis.KeyboardEvent).key === "Enter") e.preventDefault();
    };
    el.addEventListener("keypress", onKeyPress);
    return () => el.removeEventListener("keypress", onKeyPress);
  }, []);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body ? active : null;
    const scrollY = window.scrollY;
    lastInput.current = "keyboard";
    keyArmed.current = false;
    const modal = openModal(el);
    if (!modal) {
      // 고정 배치를 먼저 달고 연다(포커스가 화면을 창 쪽으로 스크롤하지 않게)
      el.setAttribute("data-fallback", "");
      el.setAttribute("open", "");
      setFallback(true);
    }
    lockScroll();
    focusInitial(el);
    return () => {
      if (modal) {
        if (el.open) el.close();
      } else {
        el.removeAttribute("open");
        el.removeAttribute("data-fallback");
        setFallback(false);
      }
      unlockScroll();
      // 스타일이 적용되지 않아 포커스가 화면을 창 쪽으로 옮겼다면 제자리로 돌린다
      if (!modal && window.scrollY !== scrollY) window.scrollTo(0, scrollY);
      if (!opener || !opener.isConnected) return;
      // 터치·펜으로 닫았고 연 요소가 입력칸이면 포커스를 돌려주지 않는다(모바일 키보드가 다시 올라오지 않게)
      if (lastInput.current === "touch" && isTextEntry(opener)) {
        if (document.activeElement === opener) opener.blur();
        return;
      }
      opener.focus({ preventScroll: true });
    };
  }, [open]);

  // Esc: 기본 닫기를 막고 상태로 닫는다
  const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (latest.current.dismissible) latest.current.onClose();
  };

  // 브라우저가 스스로 닫은 경우(취소할 수 없는 Esc 등): 상태를 맞추거나, 닫히면 안 되는 창은 다시 연다
  const handleNativeClose = () => {
    const el = ref.current;
    if (!el || el.open || !latest.current.open) return;
    if (latest.current.dismissible) {
      latest.current.onClose();
    } else if (openModal(el)) {
      focusInitial(el);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    lastInput.current = "keyboard";
    // 창을 열기 전부터 누르고 있던 Enter 의 자동 반복: 새 키를 누르기 전까지 버튼을 누르지 않게 막는다
    if (e.key === "Enter" && e.repeat && !keyArmed.current) {
      e.preventDefault();
      return;
    }
    if (!e.nativeEvent.isComposing) keyArmed.current = true;
    // showModal 이 없는 브라우저는 cancel 이벤트가 없어 Esc 를 여기서 받는다
    if (e.key === "Escape" && fallback) {
      e.preventDefault();
      if (latest.current.dismissible) latest.current.onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const el = ref.current;
    if (!el) return;
    const items = tabbables(el);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    const outside = current === el || !el.contains(current);
    if (e.shiftKey && (current === first || outside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (current === last || outside)) {
      e.preventDefault();
      first.focus();
    }
  };

  // 바깥 클릭: 배경 막에서 누르고 뗀 경우만(창 안에서 끌어 바깥에서 놓은 것은 제외)
  const handlePointerDown = (e: PointerEvent<HTMLDialogElement>) => {
    lastInput.current = pointerKind(e);
    const el = ref.current;
    pressedOnBackdrop.current = !!el && e.target === el && isOutside(el, e.clientX, e.clientY);
  };

  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    const el = ref.current;
    const fromBackdrop = pressedOnBackdrop.current;
    pressedOnBackdrop.current = false;
    if (!el || e.target !== el || !fromBackdrop || !isOutside(el, e.clientX, e.clientY)) return;
    if (latest.current.dismissible) latest.current.onClose();
  };

  return (
    <>
      {fallback && (
        // showModal 이 없는 브라우저의 배경 막(뒤 화면 클릭을 막고, dismissible 이면 눌러서 닫는다). 창보다 앞에 둬 창이 위에 그려진다
        <div
          aria-hidden="true"
          className={FALLBACK_BACKDROP}
          onPointerDown={(e) => {
            lastInput.current = pointerKind(e);
          }}
          onClick={() => {
            if (latest.current.dismissible) latest.current.onClose();
          }}
        />
      )}
      <dialog
        ref={ref}
        role={role === "alertdialog" ? "alertdialog" : fallback ? "dialog" : undefined}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cx(PANEL, PLACEMENT[placement], FALLBACK, className)}
        onCancel={handleCancel}
        onClose={handleNativeClose}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        {children}
      </dialog>
    </>
  );
}
