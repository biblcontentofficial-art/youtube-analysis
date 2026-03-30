"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue?: string;
}

export default function ThreadsSearchBar({ defaultValue = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/threads?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={`flex items-center gap-2 bg-gray-900 border rounded-xl px-4 py-3 transition ${
          focused ? "border-teal-500" : "border-gray-700"
        }`}
      >
        {/* Threads 아이콘 */}
        <svg viewBox="0 0 192 192" fill="currentColor" className="w-4 h-4 text-gray-500 shrink-0">
          <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.372-39.134 15.265-38.105 34.569.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.05-14.127 5.177-6.6 8.452-15.153 9.898-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C88.984 150.013 83 132.995 82.667 112h-16.8c.353 24.923 7.62 44.968 21.516 59.273C101.182 185.072 122.027 192.113 148 192.351l.26-.002c29.603-.223 52.246-9.272 67.285-24.9 18.141-18.692 17.764-42.228 11.712-56.621-4.284-9.986-12.383-18.092-23.965-23.999a66.667 66.667 0 0 0-1.755-.84Z"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="키워드 입력 (예: 다이어트, 재테크, 자기계발)"
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={() => { setValue(""); inputRef.current?.focus(); }}
            className="text-gray-600 hover:text-gray-400 transition"
          >
            ✕
          </button>
        )}

        <button
          type="submit"
          disabled={!value.trim()}
          className="bg-teal-500 hover:bg-teal-400 disabled:opacity-30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
        >
          검색
        </button>
      </div>
    </form>
  );
}
