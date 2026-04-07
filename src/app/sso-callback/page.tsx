"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SSOCallback() {
  const [showRetry, setShowRetry] = useState(false);

  // 10초 이상 걸리면 재시도 버튼 표시
  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">로그인 처리중...</p>
        {showRetry && (
          <div className="mt-6 space-y-3">
            <p className="text-gray-600 text-xs">처리가 오래 걸리고 있습니다.</p>
            <button
              onClick={() => window.location.href = "/search"}
              className="text-sm text-teal-400 hover:text-teal-300 underline"
            >
              메인으로 이동하기
            </button>
          </div>
        )}
      </div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/search"
        afterSignUpUrl="/search"
      />
    </main>
  );
}
