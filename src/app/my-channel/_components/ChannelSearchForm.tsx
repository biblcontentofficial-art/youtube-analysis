"use client";

/**
 * 내 채널 분석 입력 폼(DESIGN 6.9 입력 · 6.5 주 버튼). 왼쪽 정렬, 분석한 채널 입력값을 유지한다.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function ChannelSearchForm({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [input, setInput] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    startTransition(() => {
      router.push(`/my-channel?channel=${encodeURIComponent(trimmed)}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} aria-busy={isPending || undefined} className="w-full max-w-2xl">
      <label htmlFor="channel-input" className="mb-2 block text-body-sm font-medium text-fg-2">
        YouTube 채널 URL 또는 핸들을 입력하세요
      </label>
      <div className="flex gap-2">
        <input
          id="channel-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@channelname"
          aria-describedby="channel-input-help"
          autoComplete="off"
          className="h-11 w-full min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3.5 text-base text-fg transition-colors duration-150 placeholder:text-fg-3 hover:border-line-hover focus-visible:border-accent focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-solid focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-ui"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control bg-accent px-5 text-ui font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active disabled:pointer-events-none disabled:opacity-40"
        >
          {isPending ? (
            <>
              <svg aria-hidden="true" className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              분석 중...
            </>
          ) : (
            "채널 분석하기"
          )}
        </button>
      </div>
      <p id="channel-input-help" className="mt-1.5 text-caption text-fg-3">
        입력 예시: @channelname, youtube.com/@handle, 채널 이름
      </p>
    </form>
  );
}
