"use client";

import { useState, useRef, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SuggestItem {
  channelId: string;
  title: string;
  thumbnail: string;
  subscriberCount: number;
  subscriberCountFormatted: string;
  customUrl: string | null;
}

interface Props {
  initialQuery: string;
}

export default function ChannelSearchBar({ initialQuery }: Props) {
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 디바운스 자동완성
  const fetchSuggestions = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!q.trim() || q.length < 1) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/youtube/channels/suggest?q=${encodeURIComponent(q.trim())}`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        setSuggestions(data.items ?? []);
        setShowDrop(true);
        setActiveIdx(-1);
      } catch {
        // aborted or network error — ignore
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setShowDrop(false);
    router.push(`/channels?q=${encodeURIComponent(q.trim())}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    doSearch(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    fetchSuggestions(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDrop || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0) {
        e.preventDefault();
        const item = suggestions[activeIdx];
        setValue(item.title);
        doSearch(item.title);
      }
    } else if (e.key === "Escape") {
      setShowDrop(false);
      setActiveIdx(-1);
    }
  };

  const handleSelectSuggest = (item: SuggestItem) => {
    setValue(item.title);
    setShowDrop(false);
    doSearch(item.title);
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">📺</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            placeholder="채널 이름이나 키워드로 검색..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
            autoComplete="off"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </span>
          )}
        </div>
        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shrink-0"
        >
          검색
        </button>
      </form>

      {/* 자동완성 드롭다운 */}
      {showDrop && suggestions.length > 0 && (
        <div
          ref={dropRef}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        >
          <p className="px-3 py-2 text-[11px] text-gray-500 border-b border-gray-800">
            채널 선택 후 검색하면 더 정확한 결과를 볼 수 있어요
          </p>
          <ul>
            {suggestions.map((item, i) => (
              <li key={item.channelId}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectSuggest(item); }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                    i === activeIdx ? "bg-gray-800" : "hover:bg-gray-800/60"
                  }`}
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-sm">
                      📺
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {item.customUrl && <span className="mr-2">{item.customUrl}</span>}
                      {item.subscriberCount > 0 && (
                        <span>구독자 {item.subscriberCountFormatted}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">선택</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
