"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

export default function SignInForm() {
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);

  const handleOAuth = async (provider: "oauth_custom_kakao" | "oauth_google") => {
    if (!isLoaded || loading) return;
    setLoading(provider === "oauth_custom_kakao" ? "kakao" : "google");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (signIn as any).authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/search",
      });
    } catch {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-9 h-9 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">bibl</span>
            <span className="text-teal-400"> lab</span>
          </span>
        </div>

        <p className="text-center text-gray-500 text-sm mb-10">유튜브 트렌드 분석 도구</p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
          <h1 className="text-xl font-bold text-white text-center mb-1">시작하기</h1>
          <p className="text-gray-500 text-sm text-center mb-7">
            소셜 계정으로 3초 만에 로그인하세요
          </p>

          {/* 혜택 */}
          <div className="space-y-2 mb-6">
            {[
              { icon: "🔍", text: "하루 10회 무료 검색" },
              { icon: "📈", text: "조회수·성과도 실시간 분석" },
              { icon: "💳", text: "카드 정보 불필요" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2.5 text-sm text-gray-400">
                <span className="text-base">{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>

          {/* 카카오 로그인 */}
          <button
            onClick={() => handleOAuth("oauth_custom_kakao")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold py-3.5 px-4 rounded-xl transition mb-3 disabled:opacity-70"
          >
            {loading === "kakao" ? (
              <span className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" fill="#191919"/>
              </svg>
            )}
            카카오로 계속하기
          </button>

          {/* 구글 로그인 */}
          <button
            onClick={() => handleOAuth("oauth_google")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 px-4 rounded-xl transition disabled:opacity-70"
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
            Google로 계속하기
          </button>

          <p className="mt-5 text-center text-xs text-gray-600">
            계속하면{" "}
            <a href="/terms" className="text-gray-500 hover:underline">이용약관</a>
            {" "}및{" "}
            <a href="/privacy" className="text-gray-500 hover:underline">개인정보처리방침</a>
            에 동의하는 것으로 간주됩니다
          </p>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Free 플랜으로 즉시 이용 가능 · 카드 불필요
        </p>
      </div>
    </main>
  );
}
