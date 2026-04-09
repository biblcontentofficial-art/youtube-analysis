"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SSOCallback() {
  const [showRetry, setShowRetry] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // 디버그: URL 파라미터 로깅
    const url = window.location.href;
    const hasHash = window.location.hash.length > 1;
    const hasSearch = window.location.search.length > 1;
    console.log("[SSO Callback] URL:", url);
    console.log("[SSO Callback] Has hash params:", hasHash);
    console.log("[SSO Callback] Has search params:", hasSearch);
    console.log("[SSO Callback] Hash:", window.location.hash.substring(0, 100));
    console.log("[SSO Callback] Search:", window.location.search.substring(0, 100));

    // 10초 후 재시도 버튼 표시
    const retryTimer = setTimeout(() => setShowRetry(true), 10000);
    // 60초 후 타임아웃 → /sign-in으로 리다이렉트
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
      window.location.href = "/sign-in";
    }, 60000);

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
      {/*
        signUpUrl을 /sso-callback으로 설정하여 신규 유저 transfer 시
        /sign-up으로 리다이렉트하지 않고 이 페이지에서 직접 처리
      */}
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sso-callback"
        signInFallbackRedirectUrl="/search"
        signUpFallbackRedirectUrl="/search"
        signInForceRedirectUrl="/search"
        signUpForceRedirectUrl="/search"
        afterSignInUrl="/search"
        afterSignUpUrl="/search"
      />
    </main>
  );
}
