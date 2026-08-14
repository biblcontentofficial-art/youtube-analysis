"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-white">오류가 발생했습니다</h1>
        <p className="text-neutral-500 text-sm">
          일시적인 오류입니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="bg-white hover:bg-neutral-200 text-black text-sm font-bold px-5 py-2.5 rounded-lg transition"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold px-5 py-2.5 rounded-lg border border-neutral-700 transition"
          >
            홈으로
          </a>
        </div>
      </div>
    </main>
  );
}
