"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { handleRedirectCallback, loaded } = useClerk();
  const router = useRouter();
  const [showRetry, setShowRetry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) return;

    // Clerk SDK로 직접 콜백 처리
    handleRedirectCallback({
      afterSignInUrl: "/search",
      afterSignUpUrl: "/search",
    })
      .then(() => {
        // 성공 시 /search로 이동
        router.push("/search");
      })
      .catch((err) => {
        console.error("[SSO Callback] Error:", err);
        setError(err?.message || "로그인 처리 중 오류가 발생했습니다.");
        // 에러 발생해도 3초 후 /search로 이동 시도
        setTimeout(() => {
          window.location.href = "/search";
        }, 3000);
      });
  }, [loaded, handleRedirectCallback, router]);

  // 10초 후 재시도 버튼
  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 10000);
    // 20초 후 강제 이동
    const force = setTimeout(() => {
      window.location.href = "/search";
    }, 20000);
    return () => {
      clearTimeout(timer);
      clearTimeout(force);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">로그인 처리 중...</p>
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
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
    </main>
  );
}
