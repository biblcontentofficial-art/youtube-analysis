"use client";

/**
 * 채널 찾기 검색창(앱 검색창 레시피, DESIGN 6.9 · 시안 app.html 326행).
 * - 제출하면 새 검색(서버가 한 번 차감)이다. 정렬 탭·토글은 이 경로를 쓰지 않는다(listState).
 * - 제출 중에는 버튼을 비활성으로 두어 같은 검색이 두 번 나가지 않게 한다.
 * - 예시 칩은 입력창에 채우기만 한다(자동 검색 없음, 차감 없음).
 */
import { useState, useRef, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import { CHIP } from "@/components/ui/chip";

const EXAMPLES = ["골프", "다이어트", "주식"];

interface Props {
  initialQuery: string;
  /** 검색창 바로 아래 안내 줄(남은 횟수) */
  hint?: ReactNode;
}

export default function ChannelSearchBar({ initialQuery, hint }: Props) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || isPending) return;
    // 현재 sort 파라미터 유지
    const params = new URLSearchParams(window.location.search);
    params.set("q", q);
    startTransition(() => {
      router.push(`/channels?${params.toString()}`);
    });
  };

  const fillExample = (word: string) => {
    setValue(word);
    inputRef.current?.focus();
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* 포커스: 입력 칸 자체 링 대신 틀이 흰 테두리 + 외곽선 1px(합쳐 2px, DESIGN 8 입력 규칙) */}
      <form
        role="search"
        onSubmit={handleSubmit}
        aria-busy={isPending || undefined}
        className="flex h-[50px] w-full items-center gap-2 rounded-card border border-line-strong bg-surface p-0.5 pl-4 transition-colors focus-within:border-accent has-[input:focus-visible]:outline-1 has-[input:focus-visible]:outline-offset-0 has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-accent sm:h-14 sm:p-1 lg:pl-5"
      >
        <SearchIcon className="text-fg-3" />
        <label htmlFor="channel-q" className="sr-only">
          채널 검색어
        </label>
        <input
          id="channel-q"
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="분야나 주제 키워드로 검색"
          className="h-full min-w-0 flex-1 bg-transparent text-body font-medium text-fg outline-0 placeholder:text-fg-3 lg:text-[17px]"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-full shrink-0 items-center justify-center rounded-control bg-accent px-5 text-ui font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active disabled:pointer-events-none disabled:opacity-40 lg:px-7"
        >
          {isPending ? "검색 중" : "검색"}
        </button>
      </form>
      {hint}
      <div className="scrollbar-hide -mx-6 flex items-center gap-1.5 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <span className="shrink-0 text-caption text-fg-3">예시</span>
        {EXAMPLES.map((w) => (
          <button key={w} type="button" onClick={() => fillExample(w)} className={CHIP}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
