"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  type InAppInfo,
  detectInAppBrowser,
  openInChrome,
  copyUrl,
} from "@/lib/inAppBrowser";

export default function SignInForm() {
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);
  const [copied, setCopied] = useState(false);
  const [inAppInfo, setInAppInfo] = useState<InAppInfo>({
    isInApp: false, appName: "", isAndroid: false, isIOS: false,
  });

  useEffect(() => {
    setInAppInfo(detectInAppBrowser());
  }, []);

  const handleOpenExternal = async () => {
    if (inAppInfo.isAndroid) {
      openInChrome(window.location.href);
    } else {
      const ok = await copyUrl();
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  const handleOAuth = async (provider: "kakao" | "google") => {
    if (loading) return;

    // 인앱 브라우저에서 Google OAuth는 Google 정책으로 차단됨
    if (provider === "google" && inAppInfo.isInApp) {
      handleOpenExternal();
      return;
    }

    setLoading(provider);
    try {
      const supabase = createSupabaseBrowser();
      // 추천 코드가 URL에 있으면 auth callback으로 전달
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      const callbackUrl = `${window.location.origin}/auth/callback?next=/search${ref ? `&ref=${ref}` : ""}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) {
        console.error("OAuth error:", error.message);
        setLoading(null);
      }
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
            <span style={{ color: "white", fontSize: 20, fontWeight: 900, lineHeight: 1, fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>B</span>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">bibl</span>
            <span className="text-teal-400"> lab</span>
          </span>
        </div>

        <p className="text-center text-gray-500 text-sm mb-6">유튜브 트렌드 분석 도구</p>

        {/* ── 인앱 브라우저 전용 안내 카드 ─────────────────────────────── */}
        {inAppInfo.isInApp && (
          <div className="mb-4 bg-amber-950/70 border border-amber-600/70 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-amber-300 text-sm font-bold">
                {inAppInfo.appName} 앱에서 접속 중
              </p>
            </div>
            <p className="text-amber-200/80 text-xs leading-relaxed mb-3">
              Google은 앱 내 브라우저 로그인을 보안 정책으로 <strong className="text-amber-200">차단</strong>합니다.{" "}
              {inAppInfo.isIOS
                ? "아래 방법으로 Safari에서 열어주세요."
                : "Chrome으로 열어서 로그인해 주세요."}
            </p>
            {inAppInfo.isAndroid && (
              <button
                onClick={handleOpenExternal}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-sm py-2.5 rounded-xl transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8l4 4-4 4M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Chrome으로 열기
              </button>
            )}
            {inAppInfo.isIOS && (
              <div className="space-y-2">
                <div className="bg-amber-900/50 rounded-lg p-3 text-xs text-amber-200/90 space-y-1.5">
                  <p className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">1.</span>
                    하단 또는 상단의 <strong>공유 버튼 (□↑)</strong> 을 탭하세요
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">2.</span>
                    <strong>&quot;Safari로 열기&quot;</strong> 또는 <strong>&quot;Chrome으로 열기&quot;</strong> 선택
                  </p>
                </div>
                <button
                  onClick={handleOpenExternal}
                  className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-xl transition ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사 완료! Safari에서 붙여넣기 하세요
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      주소 복사하기
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
          <h1 className="text-xl font-bold text-white text-center mb-1">시작하기</h1>
          <p className="text-gray-500 text-sm text-center mb-7">
            소셜 계정으로 3초 만에 로그인하세요
          </p>

          {/* 혜택 */}
          <div className="space-y-2 mb-6">
            {["하루 2회 무료 검색", "조회수·반응도 실시간 분석"].map((text) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-gray-400">
                {text}
              </div>
            ))}
          </div>

          {/* 카카오 로그인 */}
          <button
            onClick={() => handleOAuth("kakao")}
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
            onClick={() => handleOAuth("google")}
            disabled={!!loading}
            className={`w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 px-4 rounded-xl transition disabled:opacity-70 ${
              inAppInfo.isInApp ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
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
            {inAppInfo.isInApp ? (
              <span className="text-gray-500">Google 로그인 (외부 브라우저 필요)</span>
            ) : (
              "Google로 계속하기"
            )}
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
