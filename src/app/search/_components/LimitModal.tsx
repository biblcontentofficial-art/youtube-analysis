"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";
import type { PlanKey } from "@/lib/stripe";
import { rememberPendingKeyword } from "@/app/_components/pendingKeyword";
import { getLimitCopy, LimitPerkList } from "./limitCopy";

type Props = { show: boolean; limit: number; isMonthly: boolean; plan: PlanKey };

export default function LimitModal({ show, limit, isMonthly, plan }: Props) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  if (!show) return null;

  return user ? (
    <LimitUpgradePanel limit={limit} isMonthly={isMonthly} plan={plan} />
  ) : (
    <LimitSignUpPanel limit={limit} />
  );
}

const OVERLAY =
  "fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0";
const PANEL =
  "w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-7 text-center shadow-2xl break-keep";

// ─── 로그인된 유저 → 업그레이드 유도 ───────────────────────────────────────
export function LimitUpgradePanel({ limit, isMonthly, plan }: Omit<Props, "show">) {
  const copy = getLimitCopy(isMonthly, plan);
  return (
    <div className={OVERLAY}>
      <div className={PANEL}>
        <svg viewBox="0 0 24 24" fill="none" className="mx-auto mb-5 h-9 w-9 text-white" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
        </svg>

        <h2 className="text-xl font-bold text-white mb-2">
          {copy.period} 검색 {limit}회를 모두 사용했습니다
        </h2>
        {copy.next && (
          <p className="text-neutral-400 text-sm mb-1">
            {copy.next.name} 플랜으로 <span className="text-white font-semibold">{copy.next.searches}</span>이 가능합니다
          </p>
        )}
        <p className="text-neutral-400 text-xs">{copy.reset}</p>
        {copy.next && (
          <p className="text-neutral-400 text-xs mt-0.5">
            {copy.next.name} {copy.next.price}
          </p>
        )}

        <div className="mt-6">
          <LimitPerkList perks={copy.perks} />

          <Link
            href="/pricing"
            className="block w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-colors text-sm mb-3"
          >
            플랜 업그레이드 <span aria-hidden="true">→</span>
          </Link>

          <p className="text-xs text-neutral-400">언제든지 취소 가능 · 카드 등록 후 즉시 적용</p>
        </div>
      </div>
    </div>
  );
}

// ─── 비로그인 유저 → 가입 유도 ────────────────────────────────────────────
// 가입 버튼은 OAuth 를 바로 열지 않고 돌아갈 주소 없는 /sign-in 으로 보낸다.
// 모든 가입이 /sign-in 의 필수 동의 단계를 거치게 하고(1dcb8fb), 가입 직후 /search?q= 로 돌아와
// 확인 없이 서버 검색·차감이 일어나지 않게 하려는 것이다. 앱 안 브라우저 안내도 /sign-in 이 한다.
export function LimitSignUpPanel({ limit }: { limit: number }) {
  // 누를 때 지금 검색어를 맡아 둔다. 가입 뒤 /search 가 q 없이 열리면 SearchBar 가 입력창에만 채운다.
  const keepKeyword = () => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) rememberPendingKeyword(q);
  };

  return (
    <div className={OVERLAY}>
      <div className={PANEL}>
        <svg viewBox="0 0 24 24" fill="none" className="mx-auto mb-5 h-9 w-9 text-white" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>

        <h2 className="text-xl font-bold text-white mb-2">
          무료 검색 {limit}회를 다 쓰셨어요
        </h2>
        <p className="text-neutral-400 text-sm mb-1">
          가입하면 하루 <span className="text-white font-semibold">2회 무료 검색</span>이 계속됩니다
        </p>
        <p className="text-neutral-400 text-xs mb-7">1분 만에 가입 · Starter 플랜으로 월 50회 검색 가능</p>

        <Link
          href="/sign-in"
          onClick={keepKeyword}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold py-3.5 rounded-xl transition-colors mb-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" fill="#191919"/>
          </svg>
          카카오로 무료 가입
        </Link>

        <Link
          href="/sign-in"
          onClick={keepKeyword}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-200 text-neutral-900 font-semibold py-3.5 rounded-xl transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 무료 가입
        </Link>

        <p className="mt-5 text-xs text-neutral-400">
          가입하면{" "}
          <a href="/terms" className="hover:underline">이용약관</a> 및{" "}
          <a href="/privacy" className="hover:underline">개인정보처리방침</a>에 동의합니다
        </p>
      </div>
    </div>
  );
}
