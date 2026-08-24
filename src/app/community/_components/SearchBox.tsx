"use client";

/**
 * 게시판 검색 박스 — 제출 시 router.push 로 ?q= 를 반영한다 (page 는 1로 리셋)
 */

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function SearchBox({
  boardSlug,
  initialQuery = "",
}: {
  boardSlug: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function submit(e: FormEvent) {
    e.preventDefault();
    const term = value.trim();
    router.push(
      term
        ? `/community/${boardSlug}?q=${encodeURIComponent(term)}`
        : `/community/${boardSlug}`
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="제목·내용 검색"
        aria-label="게시판 검색"
        className="w-40 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none sm:w-52"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white hover:bg-neutral-700"
      >
        검색
      </button>
    </form>
  );
}
