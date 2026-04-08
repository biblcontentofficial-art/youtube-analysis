"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Clerk OAuth 신규 가입 콜백 처리 페이지
 *
 * Clerk이 새 유저 OAuth 가입을 처리하다가 추가 단계(이메일 인증 등)가 필요하면
 * 이 페이지로 리디렉트합니다. AuthenticateWithRedirectCallback이 자동으로 처리합니다.
 */
function SignUpContent() {
  const searchParams = useSearchParams();
  const hasClerkParams =
    searchParams.has("__clerk_ticket") ||
    searchParams.has("__clerk_status") ||
    searchParams.has("__clerk_db_jwt") ||
    searchParams.has("rotating_token") ||
    searchParams.has("nonce");

  // Clerk OAuth 콜백 파라미터가 있으면 → AuthenticateWithRedirectCallback으로 처리
  if (hasClerkParams) {
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

  // 파라미터 없이 직접 접근 → 로그인 페이지로
  if (typeof window !== "undefined") {
    window.location.replace("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">로그인 페이지로 이동 중...</p>
      </div>
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
