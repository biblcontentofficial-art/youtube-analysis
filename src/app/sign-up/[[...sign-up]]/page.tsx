"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Clerk OAuth 신규 가입 콜백 처리 페이지
 *
 * signIn.authenticateWithRedirect()로 시작한 OAuth에서 신규 유저일 때
 * Clerk가 이 페이지로 transfer 리다이렉트합니다.
 * AuthenticateWithRedirectCallback이 sign-up transfer를 자동 처리합니다.
 */
function SignUpContent() {
  const searchParams = useSearchParams();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Clerk 관련 파라미터 체크 (transfer 포함)
  const hasClerkParams =
    searchParams.has("__clerk_ticket") ||
    searchParams.has("__clerk_status") ||
    searchParams.has("__clerk_db_jwt") ||
    searchParams.has("rotating_token") ||
    searchParams.has("nonce") ||
    searchParams.has("__clerk_created_session");

  // URL hash에 Clerk 파라미터가 있을 수도 있음 (OAuth transfer)
  const [hasHashParams, setHasHashParams] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      setHasHashParams(true);
      console.log("[Sign-Up] Hash params detected:", hash.substring(0, 100));
    }
    console.log("[Sign-Up] URL:", window.location.href);
    console.log("[Sign-Up] Has clerk params:", hasClerkParams);
    console.log("[Sign-Up] Referrer:", document.referrer);
  }, [hasClerkParams]);

  // Clerk 파라미터가 있거나 hash가 있으면 → AuthenticateWithRedirectCallback으로 처리
  // 파라미터가 전혀 없으면 5초 대기 후 리다이렉트 (Clerk 내부 상태로 처리될 수 있으므로)
  useEffect(() => {
    if (!hasClerkParams && !hasHashParams) {
      const timer = setTimeout(() => setShouldRedirect(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasClerkParams, hasHashParams]);

  if (shouldRedirect) {
    if (typeof window !== "undefined") {
      window.location.replace("/sign-in");
    }
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-sm">로그인 페이지로 이동 중...</p>
      </main>
    );
  }

  // 항상 AuthenticateWithRedirectCallback을 렌더링 → Clerk 내부 transfer 상태도 처리
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">가입 처리 중...</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/search"
        signUpFallbackRedirectUrl="/search"
        signInForceRedirectUrl="/search"
        signUpForceRedirectUrl="/search"
      />
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
