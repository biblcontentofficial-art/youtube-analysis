"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "./SiteNav";

/**
 * 앱형 네비의 '비블과 함께 ▾' 드롭다운(DESIGN 6.22, 시안 app.html 264~271행).
 * 바깥 누르기·Esc 로 닫히고, 닫으면 여는 버튼으로 포커스가 돌아간다. 위아래 화살표로 항목 사이를 옮긴다.
 */
export default function NavServicesDropdown({
  label,
  items,
  pathname,
  linkClass,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  /** 여는 버튼 모양(네비 링크와 같은 값) */
  linkClass: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // 경로가 바뀌면 닫는다
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const focusItem = (index: number) => {
    const links = menuRef.current?.querySelectorAll<HTMLAnchorElement>("a");
    if (!links || links.length === 0) return;
    const i = (index + links.length) % links.length;
    links[i].focus();
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const target = e.key === "ArrowDown" ? 0 : -1;
      requestAnimationFrame(() => focusItem(target));
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(i + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(-1);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        // 탭으로 드롭다운 밖으로 나가면 닫는다
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${linkClass} gap-1`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
      >
        {label}
        <svg
          className={`size-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <ul
        id={menuId}
        ref={menuRef}
        role="menu"
        aria-label={label}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        className="absolute left-0 top-full z-10 mt-3 w-64 rounded-card border border-line bg-surface p-1.5"
      >
        {items.map((item) => {
          const current = item.match(pathname);
          return (
            <li key={item.href} role="none">
              <Link
                href={item.href}
                prefetch={item.prefetch}
                role="menuitem"
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="flex h-11 items-center rounded-md px-3 text-body-sm text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg aria-[current=page]:font-semibold aria-[current=page]:text-fg"
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
