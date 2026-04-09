"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";
import {
  type InAppInfo,
  detectInAppBrowser,
  openInChrome,
  copyUrl,
} from "@/lib/inAppBrowser";

export default function LimitModal({ show, limit }: { show: boolean; limit: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);
  const [inAppInfo, setInAppInfo] = useState<InAppInfo>({
    isInApp: false, appName: "", isAndroid: false, isIOS: false,
  });

  useEffect(() => {
    setInAppInfo(detectInAppBrowser());
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  if (!show) return null;

  const handleOpenExternal = async () => {
    if (inAppInfo.isAndroid) {
      openInChrome(window.location.href);
    } else {
      await copyUrl();
    }
  };

  const handleOAuth = async (provider: "kakao" | "google") => {
    if (loading) return;

    if (provider === "google" && inAppInfo.isInApp) {
      handleOpenExternal();
      return;
    }

    setLoading(provider);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
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

  // ─── 로그인된 유저 → 업그레이드 유도 ───────────────────────────────────────
  if (user) {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-600" />
          <div className="p-7 text-center">
            <div className="w-14 h-14 bg-teal-950/60 border border-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-teal-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              오늘 검색 {limit}회를 모두 사용했습니다
            </h2>
            <p className="text-gray-400 text-sm mb-1">
              Starter 플랜으로 <span className="text-teal-400 font-semibold">월 50회 검색</span>이 가능합니다
            </p>
            <p className="text-gray-600 text-xs mb-6">내일 자정 초기화 · Starter ₩49,000/월부터</p>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 mb-6 text-left space-y-2">
              {[
                { plan: "Starter", color: "text-teal-400", desc: "월 50회 · 알고리즘 확률 · 채널 찾기" },
                { plan: "Pro", color: "text-purple-400",  desc: "월 500회 · 영상 수집 · CSV 내보내기" },
              ].map(({ plan, color, desc }) => (
                <div key={plan} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0 text-teal-500" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-xs text-gray-400">
                    <span className={`font-semibold ${color}`}>{plan}</span>
                    <span className="text-gray-600 mx-1">—</span>
                    {desc}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/pricing"
              className="block w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition text-sm mb-3"
            >
              플랜 업그레이드 →
            </Link>

            <p className="text-xs text-gray-600">언제든지 취소 가능 · 카드 등록 후 즉시 적용</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── 비로그인 유저 → 가입 유도 ────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl">
        <div className="w-14 h-14 bg-teal-950/60 border border-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-teal-400" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          무료 검색 {limit}회를 다 쓰셨어요
        </h2>
        <p className="text-gray-400 text-sm mb-1">
          가입하면 하루 <span className="text-teal-400 font-semibold">2회 무료 검색</span>이 계속됩니다
        </p>
        <p className="text-gray-600 text-xs mb-7">1분 만에 가입 · Starter 플랜으로 월 50회 검색 가능</p>

        <button
          onClick={() => handleOAuth("kakao")}
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

        <button
          onClick={() => handleOAuth("google")}
          disabled={!!loading}
          className={`w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 rounded-xl transition disabled:opacity-70 ${
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
            <span className="text-gray-500">Google (외부 브라우저 필요)</span>
          ) : (
            "Google로 무료 가입"
          )}
        </button>
        {inAppInfo.isInApp && (
          <p className="mt-2 text-xs text-amber-400/80 text-center">
            Google은 앱 내 브라우저를 차단합니다. 카카오로 가입하거나 외부 브라우저에서 열어주세요.
          </p>
        )}

        <p className="mt-5 text-xs text-gray-600">
          가입하면{" "}
          <a href="/terms" className="hover:underline">이용약관</a> 및{" "}
          <a href="/privacy" className="hover:underline">개인정보처리방침</a>에 동의합니다
        </p>
      </div>
    </div>
  );
}
