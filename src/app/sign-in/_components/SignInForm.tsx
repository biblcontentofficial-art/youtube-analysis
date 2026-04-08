"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";

/** 인앱 브라우저(WebView) 감지 */
function detectInAppBrowser(): { isInApp: boolean; appName: string; isAndroid: boolean } {
  if (typeof window === "undefined") return { isInApp: false, appName: "", isAndroid: false };
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  if (/KAKAOTALK/i.test(ua)) return { isInApp: true, appName: "카카오톡", isAndroid };
  if (/Instagram/i.test(ua)) return { isInApp: true, appName: "인스타그램", isAndroid };
  if (/NAVER/i.test(ua)) return { isInApp: true, appName: "네이버", isAndroid };
  if (/Line\//i.test(ua)) return { isInApp: true, appName: "라인", isAndroid };
  if (/FBAN|FBAV/i.test(ua)) return { isInApp: true, appName: "페이스북", isAndroid };
  if (/NaverSearch/i.test(ua)) return { isInApp: true, appName: "네이버", isAndroid };
  // Generic WebView detection
  if (/\bwv\b/i.test(ua) && isAndroid) return { isInApp: true, appName: "앱 내 브라우저", isAndroid };
  return { isInApp: false, appName: "", isAndroid };
}

/** 안드로이드: Chrome intent URL로 강제 외부 오픈 */
function openInChrome(url: string) {
  const encoded = encodeURIComponent(url);
  window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encoded};end`;
}

/** iOS / 기타: 현재 URL을 클립보드에 복사하거나 안내 */
function copyCurrentUrl() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert("주소가 복사되었습니다.\nChrome 또는 Safari를 열어서 붙여넣기 해주세요.");
    });
  } else {
    alert(`아래 주소를 복사해 Chrome/Safari에서 열어주세요:\n\n${url}`);
  }
}

export default function SignInForm() {
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);
  const [inAppInfo, setInAppInfo] = useState<{ isInApp: boolean; appName: string; isAndroid: boolean }>({
    isInApp: false,
    appName: "",
    isAndroid: false,
  });

  useEffect(() => {
    setInAppInfo(detectInAppBrowser());
  }, []);

  const handleOAuth = async (provider: "oauth_custom_kakao" | "oauth_google") => {
    if (!isLoaded || loading) return;

    // 인앱 브라우저에서 Google OAuth 시도 시 차단 안내
    if (provider === "oauth_google" && inAppInfo.isInApp) {
      if (inAppInfo.isAndroid) {
        openInChrome(window.location.href);
      } else {
        copyCurrentUrl();
      }
      return;
    }

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
            <span style={{ color: "white", fontSize: 20, fontWeight: 900, lineHeight: 1, fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>B</span>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">bibl</span>
            <span className="text-teal-400"> lab</span>
          </span>
        </div>

        <p className="text-center text-gray-500 text-sm mb-10">유튜브 트렌드 분석 도구</p>

        {/* 인앱 브라우저 경고 배너 */}
        {inAppInfo.isInApp && (
          <div className="mb-4 bg-amber-950/60 border border-amber-700/60 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-amber-300 text-sm font-semibold mb-1">
                  {inAppInfo.appName} 앱에서 접속 중
                </p>
                <p className="text-amber-400/80 text-xs leading-relaxed">
                  Google 로그인은 앱 내 브라우저에서 차단됩니다.<br />
                  <strong>Chrome 또는 Safari</strong>에서 열어주세요.
                </p>
                <button
                  onClick={() => inAppInfo.isAndroid ? openInChrome(window.location.href) : copyCurrentUrl()}
                  className="mt-2.5 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg transition"
                >
                  {inAppInfo.isAndroid ? "Chrome으로 열기" : "주소 복사하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
          <h1 className="text-xl font-bold text-white text-center mb-1">시작하기</h1>
          <p className="text-gray-500 text-sm text-center mb-7">
            소셜 계정으로 3초 만에 로그인하세요
          </p>

          {/* 혜택 */}
          <div className="space-y-2 mb-6">
            {[
              "하루 2회 무료 검색",
              "조회수·반응도 실시간 분석",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-gray-400">
                {text}
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
            className={`w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 px-4 rounded-xl transition disabled:opacity-70 ${
              inAppInfo.isInApp
                ? "opacity-50 cursor-pointer"
                : "hover:bg-gray-100"
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
            Google로 계속하기
            {inAppInfo.isInApp && (
              <span className="text-xs text-gray-400 ml-1">(외부 브라우저 필요)</span>
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
