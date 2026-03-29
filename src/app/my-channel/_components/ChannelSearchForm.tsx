"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function ChannelSearchForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
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
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <label
        htmlFor="channel-input"
        className="block text-sm font-medium text-gray-400 mb-2"
      >
        YouTube 채널 URL 또는 핸들을 입력하세요
      </label>
      <div className="flex gap-2">
        <input
          id="channel-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@channelname"
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="shrink-0 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              분석 중...
            </span>
          ) : (
            "채널 분석하기"
          )}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-600">
        입력 예시: @channelname, youtube.com/@handle, 채널 이름
      </p>
    </form>
  );
}
