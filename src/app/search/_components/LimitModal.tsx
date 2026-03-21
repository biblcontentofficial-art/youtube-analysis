"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

export default function LimitModal({ show, limit }: { show: boolean; limit: number }) {
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);

  if (!show) return null;

  const handleOAuth = async (provider: "oauth_custom_kakao" | "oauth_google") => {
    if (!isLoaded || loading) return;
    setLoading(provider === "oauth_custom_kakao" ? "kakao" : "google");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (signIn as any).authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: typeof window !== "undefined" ? window.location.href : "/search",
      });
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl">
        {/* 아이콘 */}
        <div className="w-14 h-14 bg-amber-950/50 border border-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🔍</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          무료 검색 {limit}회를 다 쓰셨어요
        </h2>
        <p className="text-gray-400 text-sm mb-1">
          가입 후 <span className="text-teal-400 font-semibold">Starter 플랜</span>으로 월 200회 검색이 가능합니다
        </p>
        <p className="text-gray-600 text-xs mb-7">1분 만에 가입 · Starter ₩49,000/월부터</p>

        {/* 카카오 버튼 */}
        <button
          onClick={() => handleOAuth("oauth_custom_kakao")}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold py-3.5 rounded-xl transition mb-3 disabled:opacity-70"
        >
          {loading === "kakao" ? (
            <span className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" fill="#191919"/>
            </svg>
          )}
          카카오로 무료 가입
        </button>

        {/* 구글 버튼 */}
        <button
          onClick={() => handleOAuth("oauth_google")}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 rounded-xl transition disabled:opacity-70"
        >
          {loading === "google" ? (
            <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google로 무료 가입
        </button>

        <p className="mt-5 text-xs text-gray-600">
          가입하면{" "}
          <a href="/terms" className="hover:underline">이용약관</a> 및{" "}
          <a href="/privacy" className="hover:underline">개인정보처리방침</a>에 동의합니다
        </p>
      </div>
    </div>
  );
}
