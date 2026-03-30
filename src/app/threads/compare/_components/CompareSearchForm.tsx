"use client";

import { useState, useRef, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue?: string;
}

export default function CompareSearchForm({ defaultValue = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    startTransition(() => {
      router.push(`/threads/compare?q=${encodeURIComponent(q)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
        <span className="text-gray-500 text-sm shrink-0">vs</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="키워드 입력 (예: 다이어트, 재테크)"
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
        />
        {value && (
          <button type="button" onClick={() => { setValue(""); inputRef.current?.focus(); }} className="text-gray-600 hover:text-gray-400 transition">
            ✕
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim() || isPending}
          className="bg-teal-500 hover:bg-teal-400 disabled:opacity-30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
        >
          {isPending && (
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {isPending ? "비교 중..." : "비교하기"}
        </button>
      </div>
    </form>
  );
}
