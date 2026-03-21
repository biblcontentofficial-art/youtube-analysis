"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialQuery: string;
}

export default function ChannelSearchBar({ initialQuery }: Props) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    // 현재 sort 파라미터 유지
    const params = new URLSearchParams(window.location.search);
    params.set("q", q);
    router.push(`/channels?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">📺</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="분야나 주제 키워드로 검색... (예: 골프, 다이어트, 주식)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shrink-0"
      >
        검색
      </button>
    </form>
  );
}
