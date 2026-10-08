"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { NavItem } from "./SiteNav";

export type NavSheetGroup = { title: string; items: NavItem[] };

/** 시트 아래 구성. home-guest = 흰 '무료로 검색 시작하기' + 로그인(보조), home-member = '마이페이지' 행, none = 없음 */
export type NavSheetFooter = "home-guest" | "home-member" | "none";

const ROW =
  "flex h-14 items-center justify-between text-lead font-semibold text-fg transition-colors duration-150 hover:text-fg-2";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 1280 미만 전체 높이 메뉴 시트(DESIGN 6.2, 시안 home.html 245~270행 · app.html 281~304행).
 * 열리면 포커스를 시트 안 첫 항목으로 옮기고, Tab 은 시트와 메뉴 버튼 사이에서만 돈다.
 * Esc·바깥 누르기·항목 누르기·1280 이상으로 넓어지면 닫힌다. 열린 동안 페이지 스크롤을 잠근다.
 */
export default function NavMenuSheet({
  id,
  open,
  onClose,
  triggerRef,
  groups,
  pathname,
  footer,
  kakaoRow,
}: {
  id: string;
  open: boolean;
  /** restoreFocus: 닫은 뒤 메뉴 버튼으로 포커스를 돌릴지 */
  onClose: (restoreFocus: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  groups: NavSheetGroup[];
  pathname: string;
  footer: NavSheetFooter;
  /** 마지막 묶음 끝에 '카카오톡 문의' 행(앱형 시트) */
  kakaoRow?: boolean;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    // 페이지 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 포커스를 시트 안으로
    const first = sheet.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose(true);
        return;
      }
      if (e.key !== "Tab") return;
      // 포커스 가두기: [메뉴 버튼, 시트 안 항목들] 사이에서만 돈다
      const trigger = triggerRef.current;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      const ring = trigger ? [trigger, ...items] : items;
      if (ring.length === 0) return;
      const i = ring.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = e.shiftKey ? (i <= 0 ? ring.length - 1 : i - 1) : (i === -1 || i === ring.length - 1 ? 0 : i + 1);
      ring[next].focus();
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (sheet.contains(t) || triggerRef.current?.contains(t)) return;
      onClose(false);
    };

    // 1280 이상으로 넓어지면 시트가 사라지므로 상태도 닫는다
    const mq = window.matchMedia("(min-width: 80rem)");
    const onWide = () => {
      if (mq.matches) onClose(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    mq.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      mq.removeEventListener("change", onWide);
    };
  }, [open, onClose, triggerRef]);

  return (
    <div
      id={id}
      ref={sheetRef}
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
      className="fixed inset-x-0 bottom-0 top-14 overflow-y-auto overscroll-contain border-t border-line bg-canvas nav:hidden"
    >
      <nav aria-label="메뉴 목록" className="mx-auto max-w-wide px-6 pb-28 pt-2 lg:px-8">
        {groups.map((group, gi) => (
          <div key={group.title}>
            <p id={`${id}-g${gi}`} className={`${gi === 0 ? "pt-4" : "mt-6"} text-caption text-fg-3`}>
              {group.title}
            </p>
            <ul aria-labelledby={`${id}-g${gi}`} className="mt-1 divide-y divide-line-soft">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={item.prefetch}
                    aria-current={item.match(pathname) ? "page" : undefined}
                    onClick={() => onClose(false)}
                    className={ROW}
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-fg-4">→</span>
                  </Link>
                </li>
              ))}
              {kakaoRow && gi === groups.length - 1 && (
                <li>
                  <a
                    href="https://pf.kakao.com/_beBNn/chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onClose(false)}
                    className={ROW}
                  >
                    <span>
                      카카오톡 문의<span className="sr-only"> (새 창)</span>
                    </span>
                    {/* 새 창 표시(장식). 글자 ↗ 대신 맨 SVG */}
                    <svg aria-hidden="true" className="size-4 text-fg-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                  </a>
                </li>
              )}
            </ul>
          </div>
        ))}

        {footer === "home-member" && (
          <ul className="mt-6 divide-y divide-line-soft border-t border-line-soft">
            <li>
              <Link
                href="/mypage"
                aria-current={pathname === "/mypage" ? "page" : undefined}
                onClick={() => onClose(false)}
                className={ROW}
              >
                마이페이지
                <span aria-hidden="true" className="text-fg-4">→</span>
              </Link>
            </li>
          </ul>
        )}

        {footer === "home-guest" && (
          <div className="mt-8 grid gap-2">
            <Link
              href="/sign-in"
              onClick={() => onClose(false)}
              className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-control bg-accent text-ui font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active"
            >
              무료로 검색 시작하기
            </Link>
            <Link
              href="/sign-in"
              onClick={() => onClose(false)}
              className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-control border border-line-strong bg-surface text-ui font-semibold text-fg transition-colors duration-150 hover:border-line-hover hover:bg-surface-2"
            >
              로그인
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
