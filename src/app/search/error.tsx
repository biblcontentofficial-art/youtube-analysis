"use client";

import { useEffect } from "react";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SearchError]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">🔍</div>
        <h2 className="text-lg font-bold text-white">검색 중 오류가 발생했습니다</h2>
        <p className="text-gray-500 text-sm">잠시 후 다시 시도해주세요.</p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            다시 시도
          </button>
          <a
            href="/search"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold px-5 py-2.5 rounded-lg border border-gray-700 transition"
          >
            검색 초기화
          </a>
        </div>
      </div>
    </main>
  );
}
