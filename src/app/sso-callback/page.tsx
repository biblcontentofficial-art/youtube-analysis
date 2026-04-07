"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SSOCallback() {
  const [showRetry, setShowRetry] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // 8초 후 재시도 버튼 표시
    const retryTimer = setTimeout(() => setShowRetry(true), 8000);
    // 20초 후 타임아웃 → /sign-in으로 리다이렉트
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
      window.location.href = "/sign-in";
    }, 20000);

    return () => {
      clearTimeout(retryTimer);
      clearTimeout(timeoutTimer);
    };
  }, []);

  if (timedOut) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">로그인 페이지로 이동 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">로그인 처리 중...</p>
        {showRetry && (
          <div className="mt-6 space-y-3">
            <p className="text-gray-600 text-xs">처리가 오래 걸리고 있습니다.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = "/sign-in"}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
              >
                다시 로그인
              </button>
              <button
                onClick={() => window.location.href = "/search"}
                className="text-sm text-teal-400 hover:text-teal-300 underline"
              >
                메인으로 이동
              </button>
            </div>
          </div>
        )}
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/search"
        signUpFallbackRedirectUrl="/search"
      />
    </main>
  );
}
