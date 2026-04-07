"use client";

import { useEffect } from "react";

export default function SSOCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SSO Callback Error]", error.message);
    // 3초 후 로그인 페이지로 자동 이동
    const timer = setTimeout(() => {
      window.location.href = "/sign-in";
    }, 3000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-5 mx-auto">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">로그인 처리 중 문제가 발생했습니다</h2>
        <p className="text-gray-500 text-sm mb-6">잠시 후 로그인 페이지로 이동합니다.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-sm font-semibold transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = "/sign-in"}
            className="px-5 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    </main>
  );
}
