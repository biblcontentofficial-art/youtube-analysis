"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";

export default function SSOCallback() {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const [showRetry, setShowRetry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processing = useRef(false);

  useEffect(() => {
    const retryTimer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(retryTimer);
  }, []);

  useEffect(() => {
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
    if (processing.current) return;
    processing.current = true;

    async function handleOAuthCallback() {
      try {
        console.log("[SSO Callback] signIn status:", signIn!.status);
        console.log("[SSO Callback] firstFactor:", signIn!.firstFactorVerification?.status);

        // Case 1: Sign-in이 이미 완료된 경우 (기존 유저)
        if (signIn!.status === "complete" && signIn!.createdSessionId) {
          console.log("[SSO Callback] Sign-in complete, setting active session");
          await setSignInActive!({ session: signIn!.createdSessionId });
          window.location.href = "/search";
          return;
        }

        // Case 2: Transfer 필요 (신규 유저 - signIn으로 시작했지만 계정이 없음)
        const firstFactorStatus = signIn!.firstFactorVerification?.status;
        if (firstFactorStatus === "transferable") {
          console.log("[SSO Callback] Transfer needed - creating sign-up from transfer");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (signUp as any).create({ transfer: true });
          console.log("[SSO Callback] Sign-up result status:", result.status);

          if (result.status === "complete" && result.createdSessionId) {
            await setSignUpActive!({ session: result.createdSessionId });
            window.location.href = "/search";
            return;
          }

          // Sign-up이 완료되지 않은 경우 (추가 단계 필요)
          console.log("[SSO Callback] Sign-up not complete, status:", result.status);
          setError(`가입 처리 중 추가 단계가 필요합니다 (${result.status})`);
          return;
        }

        // Case 3: signUp이 이미 완료된 경우 (signUp으로 시작한 OAuth)
        if (signUp!.status === "complete" && signUp!.createdSessionId) {
          console.log("[SSO Callback] Sign-up already complete, setting active session");
          await setSignUpActive!({ session: signUp!.createdSessionId });
          window.location.href = "/search";
          return;
        }

        // Case 4: signUp에서 transfer 가능한 경우 (기존 유저가 signUp으로 시작)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const externalStatus = (signUp as any)?.verifications?.externalAccount?.status;
        if (externalStatus === "transferable") {
          console.log("[SSO Callback] SignUp transferable - creating sign-in from transfer");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (signIn as any).create({ transfer: true });

          if (result.status === "complete" && result.createdSessionId) {
            await setSignInActive!({ session: result.createdSessionId });
            window.location.href = "/search";
            return;
          }
        }

        // 어떤 케이스에도 해당하지 않는 경우
        console.log("[SSO Callback] Unhandled state:", {
          signInStatus: signIn!.status,
          firstFactor: firstFactorStatus,
          signUpStatus: signUp!.status,
          externalStatus,
        });
        setError("로그인 처리를 완료할 수 없습니다. 다시 시도해주세요.");
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ code: string; message: string }> };
        const errorCode = clerkError.errors?.[0]?.code;
        const errorMsg = clerkError.errors?.[0]?.message || String(err);

        console.error("[SSO Callback] Error:", errorCode, errorMsg);

        // external_account_not_found → sign-up transfer 시도
        if (errorCode === "external_account_not_found") {
          try {
            console.log("[SSO Callback] Attempting sign-up transfer after error");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (signUp as any).create({ transfer: true });
            if (result.status === "complete" && result.createdSessionId) {
              await setSignUpActive!({ session: result.createdSessionId });
              window.location.href = "/search";
              return;
            }
          } catch (transferErr) {
            console.error("[SSO Callback] Transfer error:", transferErr);
            setError("신규 가입 처리 실패. 다시 시도해주세요.");
            return;
          }
        }

        setError(errorMsg);
      }
    }

    handleOAuthCallback();
  }, [signInLoaded, signUpLoaded, signIn, signUp, setSignInActive, setSignUpActive]);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        {!error && (
          <>
            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">로그인 처리 중...</p>
          </>
        )}
        {error && (
          <div className="max-w-sm mx-auto">
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg p-4 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.href = "/sign-in"}
              className="text-sm text-teal-400 hover:text-teal-300 underline"
            >
              다시 로그인
            </button>
          </div>
        )}
        {showRetry && !error && (
          <div className="mt-6 space-y-3">
            <p className="text-gray-600 text-xs">처리가 오래 걸리고 있습니다.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = "/sign-in"}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
              >
                다시 로그인
              </button>
              <button
                onClick={() => window.location.href = "/search"}
                className="text-sm text-teal-400 hover:text-teal-300 underline"
              >
                메인으로 이동
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
