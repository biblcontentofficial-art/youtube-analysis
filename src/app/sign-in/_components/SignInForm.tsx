"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  type InAppInfo,
  detectInAppBrowser,
  openInChrome,
  copyUrl,
} from "@/lib/inAppBrowser";
import { Logo } from "@/components/ui/logo";
import { buttonClass, cx } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";

// 로그인 실패·취소 안내(auth/callback 이 ?error= 로 돌려보낸다). 고정 문장만 보여 준다
const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "로그인을 완료하지 못했습니다. 다시 시도해 주세요.",
  no_code: "로그인이 취소되었습니다.",
};
const OAUTH_ERROR_MESSAGE = ERROR_MESSAGES.auth_failed;

// 동의 체크를 탭 안에서만 기억해 실패·취소 뒤 돌아와도 다시 체크하지 않게 한다
const CONSENT_KEY = "bibl_signin_consent";

const CONSENT_ROW = "flex min-h-11 cursor-pointer select-none items-center gap-3";
const VIEW_LINK =
  "-mr-2 shrink-0 px-2 py-2 text-caption text-fg-3 underline underline-offset-2 transition-colors hover:text-fg";

export default function SignInForm() {
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);
  // 동의 단계: 필수 2건(약관·개인정보) + 선택 1건(마케팅), 일괄 동의 지원
  const [step, setStep] = useState<"consent" | "login">("consent");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [marketingOk, setMarketingOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasRef, setHasRef] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [consentRestored, setConsentRestored] = useState(false);

  const requiredOk = agreeTerms && agreePrivacy;
  const allChecked = agreeTerms && agreePrivacy && marketingOk;
  const toggleAll = (v: boolean) => {
    setAgreeTerms(v);
    setAgreePrivacy(v);
    setMarketingOk(v);
  };
  const [inAppInfo, setInAppInfo] = useState<InAppInfo>({
    isInApp: false, appName: "", isAndroid: false, isIOS: false,
  });

  useEffect(() => {
    setInAppInfo(detectInAppBrowser());

    // ?error·?ref 는 window.location 으로 읽는다(useSearchParams 는 Suspense 경계가 필요해 정적 화면이 CSR 로 떨어진다)
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err && ERROR_MESSAGES[err]) setErrorMsg(ERROR_MESSAGES[err]);
    if (params.get("ref")) setHasRef(true);

    try {
      const saved = window.sessionStorage.getItem(CONSENT_KEY);
      if (saved) {
        const c = JSON.parse(saved) as { terms?: boolean; privacy?: boolean; mkt?: boolean };
        setAgreeTerms(!!c.terms);
        setAgreePrivacy(!!c.privacy);
        setMarketingOk(!!c.mkt);
      }
    } catch {
      // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기억하지 않는다
    }
    setConsentRestored(true);

    // 이미 로그인한 상태인지(로컬 세션만 읽는다, 화면 표시용)
    let cancelled = false;
    (async () => {
      try {
        const { data } = await createSupabaseBrowser().auth.getSession();
        if (!cancelled && data.session) setSignedIn(true);
      } catch {
        // 세션을 못 읽으면 로그인 폼을 그대로 보여 준다
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!consentRestored) return;
    try {
      window.sessionStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ terms: agreeTerms, privacy: agreePrivacy, mkt: marketingOk }),
      );
    } catch {
      // 무시
    }
  }, [consentRestored, agreeTerms, agreePrivacy, marketingOk]);

  const handleCopy = async () => {
    const ok = await copyUrl();
    if (ok) {
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setCopyFailed(true);
    }
  };

  const handleOpenExternal = async () => {
    if (inAppInfo.isAndroid) {
      openInChrome(window.location.href);
    } else {
      await handleCopy();
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
    setErrorMsg(null);
    try {
      const supabase = createSupabaseBrowser();
      // 추천 코드가 URL에 있으면 auth callback으로 전달
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      const callbackUrl = `${window.location.origin}/auth/callback?next=/search${ref ? `&ref=${ref}` : ""}&mkt=${marketingOk ? 1 : 0}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) {
        console.error("OAuth error:", error.message);
        setErrorMsg(OAUTH_ERROR_MESSAGE);
        setLoading(null);
      }
    } catch {
      setErrorMsg(OAUTH_ERROR_MESSAGE);
      setLoading(null);
    }
  };

  const externalName = inAppInfo.isIOS ? "Safari" : "Chrome";

  return (
    <main className="flex justify-center px-6 pb-16 pt-8 sm:min-h-[calc(100dvh-var(--nav-h))] sm:items-center sm:py-16">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mb-4 mt-1.5 text-center text-body-sm text-fg-3">유튜브 트렌드 분석 도구</p>

        <div className="rounded-panel border border-line bg-surface p-6 md:p-8">
          {/* 로그인 실패·취소 안내 */}
          {errorMsg && !signedIn && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-card border border-negative/55 px-3.5 py-3"
            >
              <WarningIcon size={20} className="mt-px text-negative" />
              <p className="text-body-sm font-medium text-fg-1">{errorMsg}</p>
            </div>
          )}

          {/* 초대 링크 안내 */}
          {hasRef && !signedIn && (
            <p className="mb-4 rounded-card border border-line px-3.5 py-3 text-body-sm text-fg-2">
              초대 링크로 들어오셨습니다.
            </p>
          )}

          {signedIn ? (
            <>
              <h1 className="text-center text-h4 text-fg">이미 로그인되어 있습니다</h1>
              <Link
                href="/search"
                className={cx(buttonClass({ variant: "secondary", size: "lg", block: true }), "mt-6")}
              >
                검색으로
              </Link>
            </>
          ) : step === "consent" ? (
            <>
              <h1 className="mb-1 text-center text-h4 text-fg">시작하기 전에</h1>
              <p className="mb-5 text-center text-body-sm text-fg-3 sm:mb-6">
                서비스 이용을 위한 동의가 필요합니다
              </p>

              {/* 전체 동의 */}
              <label className="mb-3 flex min-h-[52px] cursor-pointer select-none items-center gap-3 rounded-control border border-line-strong bg-surface-2 px-3.5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="chk"
                />
                <span className="text-ui font-bold text-fg">전체 동의합니다</span>
              </label>

              <div className="mb-6 px-3.5">
                <label className={CONSENT_ROW}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="chk"
                  />
                  <span className="flex-1 text-body-sm text-fg-2">[필수] 이용약관 동의</span>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className={VIEW_LINK}>보기</a>
                </label>
                <label className={CONSENT_ROW}>
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="chk"
                  />
                  <span className="flex-1 text-body-sm text-fg-2">[필수] 개인정보 수집·이용 동의</span>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className={VIEW_LINK}>보기</a>
                </label>
                <label className={CONSENT_ROW}>
                  <input
                    type="checkbox"
                    checked={marketingOk}
                    onChange={(e) => setMarketingOk(e.target.checked)}
                    className="chk"
                  />
                  <span className="flex-1 text-body-sm text-fg-2">[선택] 이벤트·혜택 등 마케팅 정보 수신 동의</span>
                </label>
              </div>

              {/* 이 화면의 흰 면은 구글 버튼 하나라(DESIGN 3.2) 진행 버튼은 보조 모양 */}
              <button
                type="button"
                onClick={() => requiredOk && setStep("login")}
                disabled={!requiredOk}
                className={buttonClass({ variant: "secondary", size: "lg", block: true })}
              >
                동의하고 계속하기
              </button>
              <p className="mt-3 text-center text-caption text-fg-3">
                선택 항목은 동의하지 않아도 서비스를 이용할 수 있습니다
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-center text-h4 text-fg">시작하기</h1>
              <p className="mb-6 text-center text-body-sm text-fg-3">
                소셜 계정으로 3초 만에 로그인하세요
              </p>

              {/* 혜택 */}
              <ul className="mb-6 space-y-1.5">
                {["하루 2회 무료 검색", "조회수·구독자·게시일 한눈에 확인"].map((text) => (
                  <li key={text} className="text-body-sm text-fg-2">
                    {text}
                  </li>
                ))}
              </ul>

              {/* 카카오 로그인 */}
              <button
                type="button"
                onClick={() => handleOAuth("kakao")}
                disabled={!!loading}
                aria-busy={loading === "kakao" || undefined}
                className={cx(buttonClass({ variant: "kakao", size: "lg", block: true }), "mb-3 gap-3")}
              >
                {loading === "kakao" ? (
                  <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-kakao-ink/30 border-t-kakao-ink" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-kakao-icon">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" fill="currentColor"/>
                  </svg>
                )}
                카카오로 계속하기
              </button>

              {/* 구글 로그인: 구글 가이드대로 흰 면 + 4색 G(브랜드 자산, 하드코딩 예외) */}
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={!!loading}
                aria-busy={loading === "google" || undefined}
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-control bg-accent px-4 py-2 text-ui font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active disabled:pointer-events-none disabled:opacity-40"
              >
                {loading === "google" ? (
                  <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-line-hover border-t-accent-ink" />
                ) : (
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {/* 인앱 라벨은 좁은 화면에서 괄호 부분만 다음 줄로 넘긴다 */}
                <span className="min-w-0 text-center">
                  <span className="whitespace-nowrap">Google로 계속하기</span>
                  {inAppInfo.isInApp && (
                    <>
                      {" "}
                      <span className="whitespace-nowrap">({externalName}에서 열기)</span>
                    </>
                  )}
                </span>
              </button>

              {/* 인앱 브라우저 안내: 구글 버튼 바로 아래, 채움 없이 caution 글자·테두리 */}
              {inAppInfo.isInApp && (
                <div className="mt-3 rounded-card border border-caution/55 p-4">
                  <p className="flex items-center gap-2 text-body-sm font-semibold text-caution">
                    <WarningIcon size={16} />
                    {inAppInfo.appName} 앱에서 접속 중
                  </p>
                  <p className="mt-2 text-caption text-caution">
                    Google은 앱 내 브라우저 로그인을 보안 정책으로 차단합니다.{" "}
                    {inAppInfo.isIOS
                      ? "아래 방법으로 Safari에서 열어주세요."
                      : "Chrome으로 열어서 로그인해 주세요."}
                  </p>
                  {inAppInfo.isIOS && (
                    <ol className="mt-2 space-y-1 text-caption text-fg-2">
                      <li>1. 하단 또는 상단의 <strong className="font-semibold text-fg">공유 버튼 (□↑)</strong> 을 탭하세요</li>
                      <li>2. <strong className="font-semibold text-fg">&quot;Safari로 열기&quot;</strong> 또는 <strong className="font-semibold text-fg">&quot;Chrome으로 열기&quot;</strong> 선택</li>
                    </ol>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inAppInfo.isAndroid && (
                      <button
                        type="button"
                        onClick={handleOpenExternal}
                        className={cx(buttonClass({ variant: "secondary", size: "sm" }), "min-h-11")}
                      >
                        Chrome으로 열기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={cx(buttonClass({ variant: "secondary", size: "sm" }), "min-h-11")}
                    >
                      {copied ? "주소를 복사했습니다" : "주소 복사하기"}
                    </button>
                  </div>
                  {copyFailed && (
                    <p className="mt-2 select-all break-all text-micro text-fg-2">
                      {typeof window !== "undefined" ? window.location.href : ""}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setStep("consent")}
                  className="inline-flex h-11 items-center text-caption text-fg-3 underline underline-offset-2 transition-colors hover:text-fg"
                >
                  동의 항목 다시 보기
                </button>
              </p>
            </>
          )}
        </div>

        {!signedIn && (
          <p className="mt-6 text-center text-caption text-fg-3">
            Free 플랜으로 즉시 이용 가능 · 카드 불필요
          </p>
        )}
      </div>
    </main>
  );
}
