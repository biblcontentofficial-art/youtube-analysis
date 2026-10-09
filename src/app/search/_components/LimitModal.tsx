"use client";

/**
 * 검색 한도 초과 창. /search 서버가 한도에서 멈췄을 때(show) 띄운다.
 * - 셸은 components/ui/dialog.tsx(최상위 층·포커스 가둠·복귀, 패널 surface-2 #171717, DESIGN 6.11).
 * - 결정 11 기본(C): 닫기 없음. Esc·바깥 클릭으로 닫히지 않는다(dismissible=false). 동작은 요금제·가입 버튼으로만.
 * - 로그인 여부를 확인하기 전에는 아무 패널도 그리지 않는다(가입 패널이 잠깐 보였다 바뀌지 않게).
 * - 남은 횟수 표기는 DESIGN 3.1 규칙: 0회 = negative 테두리·글자.
 */
import { useId, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";
import type { PlanKey } from "@/lib/stripe";
import { rememberPendingKeyword } from "@/app/_components/pendingKeyword";
import { Dialog } from "@/components/ui/dialog";
import { DIALOG_DESCRIPTION } from "@/components/ui/dialog-classes";
import { buttonClass, cx } from "@/components/ui/button";
import { getLimitCopy, LimitPerkList } from "./limitCopy";

type Props = { show: boolean; limit: number; isMonthly: boolean; plan: PlanKey };

export default function LimitModal({ show, limit, isMonthly, plan }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch {
        // 확인에 실패하면 비로그인으로 보고 가입 패널을 띄운다
        setUser(null);
      } finally {
        setChecked(true);
      }
    };
    fetchUser();
  }, []);

  if (!show || !checked) return null;

  return user ? (
    <LimitUpgradePanel limit={limit} isMonthly={isMonthly} plan={plan} />
  ) : (
    <LimitSignUpPanel limit={limit} />
  );
}

/** 닫을 수 없는 한도 창 셸(결정 11 기본 C) */
function LimitDialog({ titleId, children }: { titleId: string; children: ReactNode }) {
  return (
    <Dialog open onClose={() => {}} dismissible={false} labelledBy={titleId} placement="sheet" className="text-center break-keep">
      {children}
    </Dialog>
  );
}

const TITLE = "text-h4 font-bold text-fg";
/** 남은 횟수 0회 배지(DESIGN 6.12 남은 횟수, 0회 = negative) */
const ZERO_BADGE =
  "mb-4 inline-flex h-8 items-center rounded-control border border-negative/55 px-2.5 text-caption font-medium text-negative tnum";

// ─── 로그인된 유저 → 업그레이드 유도 ───────────────────────────────────────
export function LimitUpgradePanel({ limit, isMonthly, plan }: Omit<Props, "show">) {
  const copy = getLimitCopy(isMonthly, plan);
  const titleId = useId();
  return (
    <LimitDialog titleId={titleId}>
      <p className={ZERO_BADGE}>{copy.period} 0회 남음</p>
      <h2 id={titleId} className={TITLE}>
        {copy.period} 검색 {limit}회를 모두 사용했습니다
      </h2>
      {copy.next && (
        <p className={DIALOG_DESCRIPTION}>
          {copy.next.name} 플랜으로 <span className="font-semibold text-fg">{copy.next.searches}</span>이 가능합니다
        </p>
      )}
      <p className="mt-1 text-caption text-fg-3">{copy.reset}</p>
      {copy.next && (
        <p className="mt-0.5 text-caption text-fg-3">
          {copy.next.name} {copy.next.price}
        </p>
      )}

      <div className="mt-6">
        <LimitPerkList perks={copy.perks} />

        <Link href="/pricing" data-autofocus className={buttonClass({ size: "lg", block: true })}>
          플랜 업그레이드 <span aria-hidden="true">→</span>
        </Link>

        <p className="mt-3 text-caption text-fg-3">언제든지 취소 가능 · 카드 등록 후 즉시 적용</p>
      </div>
    </LimitDialog>
  );
}

// ─── 비로그인 유저 → 가입 유도 ────────────────────────────────────────────
// 가입 버튼은 OAuth 를 바로 열지 않고 돌아갈 주소 없는 /sign-in 으로 보낸다.
// 모든 가입이 /sign-in 의 필수 동의 단계를 거치게 하고(1dcb8fb), 가입 직후 /search?q= 로 돌아와
// 확인 없이 서버 검색·차감이 일어나지 않게 하려는 것이다. 앱 안 브라우저 안내도 /sign-in 이 한다.
export function LimitSignUpPanel({ limit }: { limit: number }) {
  const titleId = useId();
  // 누를 때 지금 검색어를 맡아 둔다. 가입 뒤 /search 가 q 없이 열리면 SearchBar 가 입력창에만 채운다.
  const keepKeyword = () => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) rememberPendingKeyword(q);
  };

  return (
    <LimitDialog titleId={titleId}>
      <p className={ZERO_BADGE}>무료 검색 0회 남음</p>
      <h2 id={titleId} className={TITLE}>
        무료 검색 {limit}회를 다 쓰셨어요
      </h2>
      <p className={DIALOG_DESCRIPTION}>
        가입하면 하루 <span className="font-semibold text-fg">2회 무료 검색</span>이 계속됩니다
      </p>
      <p className="mb-6 mt-1 text-caption text-fg-3">1분 만에 가입 · Starter 플랜으로 월 50회 검색 가능</p>

      <Link
        href="/sign-in"
        onClick={keepKeyword}
        data-autofocus
        className={cx(buttonClass({ variant: "kakao", size: "lg", block: true }), "mb-3")}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" fill="currentColor"/>
        </svg>
        카카오로 무료 가입
      </Link>

      <Link
        href="/sign-in"
        onClick={keepKeyword}
        className={buttonClass({ size: "lg", block: true })}
      >
        {/* 구글 가이드의 흰 면 + 4색 G(브랜드 자산, DESIGN 3.2 예외) */}
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google로 무료 가입
      </Link>

      <p className="mt-5 text-caption text-fg-3">
        가입하면{" "}
        <a href="/terms" className="underline underline-offset-2 hover:text-fg">이용약관</a> 및{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-fg">개인정보처리방침</a>에 동의합니다
      </p>
    </LimitDialog>
  );
}
