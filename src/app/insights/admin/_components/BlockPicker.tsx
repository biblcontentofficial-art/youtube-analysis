"use client";

/**
 * 메일리/노션 스타일 블록 추가 메뉴
 * - 검색 가능
 * - 키보드 네비 (↑↓ Enter Esc)
 * - 사용처: '/' 슬래시 트리거, '+' 호버 버튼, 하단 [+ 블록 추가] 버튼
 */

import { useEffect, useRef, useState, useMemo } from "react";
import type { PostBlock } from "@/lib/posts";

export type BlockKind =
  | "paragraph" | "h2" | "h3" | "link" | "image" | "video"
  | "youtube" | "list" | "ordered-list" | "quote" | "callout"
  | "code" | "html" | "button" | "divider";

export interface BlockOption {
  kind: BlockKind;
  label: string;
  hint?: string;
  shortcut?: string;
  icon: JSX.Element;
  keywords: string[]; // 검색 키워드 (한글/영문)
  create: () => PostBlock;
}

function Ico({ d, viewBox = "0 0 24 24" }: { d: string; viewBox?: string }) {
  return (
    <svg className="w-5 h-5" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export const BLOCK_OPTIONS: BlockOption[] = [
  {
    kind: "paragraph", label: "본문", hint: "일반 단락",
    icon: <Ico d="M4 6h16M4 12h16M4 18h10" />,
    keywords: ["본문", "단락", "paragraph", "text", "글"],
    create: () => ({ type: "paragraph", text: "" }),
  },
  {
    kind: "h2", label: "제목 H2", hint: "중제목", shortcut: "## ",
    icon: <Ico d="M4 12h8m0-7v14m8-14v14" />,
    keywords: ["제목", "헤딩", "heading", "title", "h2"],
    create: () => ({ type: "heading", level: 2, text: "" }),
  },
  {
    kind: "h3", label: "제목 H3", hint: "소제목", shortcut: "### ",
    icon: <Ico d="M4 12h6m0-6v12m6-12v12M16 18h4M16 6h4" />,
    keywords: ["제목", "헤딩", "heading", "subtitle", "h3"],
    create: () => ({ type: "heading", level: 3, text: "" }),
  },
  {
    kind: "list", label: "목록", hint: "글머리 기호",
    icon: <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    keywords: ["목록", "리스트", "list", "bullet", "ul"],
    create: () => ({ type: "list", ordered: false, items: [""] }),
  },
  {
    kind: "ordered-list", label: "번호 목록", hint: "1. 2. 3.",
    icon: <Ico d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />,
    keywords: ["순서", "번호", "ordered", "ol"],
    create: () => ({ type: "list", ordered: true, items: [""] }),
  },
  {
    kind: "image", label: "이미지", hint: "사진 업로드",
    icon: <Ico d="M3 5h18v14H3zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21" />,
    keywords: ["이미지", "사진", "image", "photo", "picture"],
    create: () => ({ type: "image", src: "", alt: "", caption: "" }),
  },
  {
    kind: "video", label: "동영상", hint: "MP4/WebM 업로드",
    icon: <Ico d="M23 7l-7 5 7 5V7zM14 5H3v14h11V5z" />,
    keywords: ["동영상", "비디오", "video", "mp4"],
    create: () => ({ type: "video", src: "", caption: "" }),
  },
  {
    kind: "youtube", label: "YouTube", hint: "유튜브 URL 임베드",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    keywords: ["유튜브", "youtube", "yt", "영상", "video"],
    create: () => ({ type: "youtube", videoId: "", caption: "" }),
  },
  {
    kind: "link", label: "링크", hint: "URL 카드",
    icon: <Ico d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07l-1.41 1.41M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 0 0 7.07 7.07l1.41-1.41" />,
    keywords: ["링크", "link", "url", "주소"],
    create: () => ({ type: "paragraph", text: "[링크 텍스트](https://)" }),
  },
  {
    kind: "quote", label: "인용", hint: "인용문",
    icon: <Ico d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />,
    keywords: ["인용", "quote", "citation"],
    create: () => ({ type: "quote", text: "", cite: "" }),
  },
  {
    kind: "callout", label: "글 박스", hint: "강조 박스 (이모지 + 글)",
    icon: <Ico d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
    keywords: ["콜아웃", "글박스", "박스", "callout", "강조"],
    create: () => ({ type: "callout", emoji: "💡", text: "" }),
  },
  {
    kind: "button", label: "버튼", hint: "CTA 버튼",
    icon: <Ico d="M6 9h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" />,
    keywords: ["버튼", "button", "cta", "링크"],
    create: () => ({ type: "button", label: "자세히 보기", url: "https://", align: "center" }),
  },
  {
    kind: "code", label: "코드", hint: "코드 블록",
    icon: <Ico d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
    keywords: ["코드", "code", "monospace"],
    create: () => ({ type: "code", lang: "", text: "" }),
  },
  {
    kind: "html", label: "HTML 삽입", hint: "<iframe> 등 직접 삽입",
    icon: <Ico d="M14 4l-4 16M16 8l4 4-4 4M8 8l-4 4 4 4" />,
    keywords: ["html", "embed", "임베드", "삽입", "iframe"],
    create: () => ({ type: "html", html: "" }),
  },
  {
    kind: "divider", label: "구분선", hint: "수평선",
    icon: <Ico d="M5 12h14" />,
    keywords: ["구분선", "선", "divider", "hr", "가로줄"],
    create: () => ({ type: "divider" }),
  },
];

interface Props {
  onPick: (block: PostBlock) => void;
  onClose: () => void;
  initialQuery?: string;
  /** 포지셔닝: anchorRect=화면 좌표 기준으로 그 아래에 떠오름 */
  anchorRect?: DOMRect | null;
  /** 풀화면 모달 모드 (anchorRect 없을 때 자동) */
  variant?: "popover" | "panel";
}

export default function BlockPicker({ onPick, onClose, initialQuery = "", anchorRect, variant }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mode: "popover" | "panel" = variant ?? (anchorRect ? "popover" : "panel");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOCK_OPTIONS;
    return BLOCK_OPTIONS.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      o.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[active];
        if (opt) onPick(opt.create());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered, onPick, onClose]);

  // 활성 아이템이 보이도록 스크롤
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // 좌표 계산 (popover)
  const popStyle: React.CSSProperties = {};
  if (mode === "popover" && anchorRect) {
    const top = anchorRect.bottom + window.scrollY + 6;
    const left = Math.min(
      anchorRect.left + window.scrollX,
      window.innerWidth - 360
    );
    popStyle.position = "absolute";
    popStyle.top = top;
    popStyle.left = Math.max(8, left);
    popStyle.width = 340;
    popStyle.maxHeight = 380;
  }

  const panel = (
    <div
      className="z-[100] bg-slate-900 border border-white/[0.10] rounded-xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
      style={popStyle}
    >
      <div className="p-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="블록 검색"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500"
          />
          <span className="text-[10px] text-slate-600 hidden sm:inline">ESC</span>
        </div>
      </div>
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: mode === "popover" ? 320 : 480 }}>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">결과 없음</div>
        ) : (
          filtered.map((opt, i) => (
            <button
              key={opt.kind}
              data-idx={i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(opt.create())}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                i === active ? "bg-teal-500/15 text-white" : "text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${
                i === active ? "bg-white/[0.08] border-teal-400/40 text-teal-200" : "bg-white/[0.04] border-white/[0.06] text-slate-400"
              }`}>
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{opt.label}</div>
                {opt.hint && <div className="text-[11px] text-slate-500">{opt.hint}</div>}
              </div>
              {opt.shortcut && (
                <code className="text-[10px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded">{opt.shortcut}</code>
              )}
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-600">
        <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04]">↑↓</kbd> 이동 · <kbd className="px-1 py-0.5 rounded bg-white/[0.04]">Enter</kbd> 선택</span>
        <span>{filtered.length}개</span>
      </div>
    </div>
  );

  if (mode === "popover") {
    return (
      <>
        <div className="fixed inset-0 z-[99]" onClick={onClose} />
        {panel}
      </>
    );
  }
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center p-4 pt-20" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {panel}
      </div>
    </div>
  );
}
