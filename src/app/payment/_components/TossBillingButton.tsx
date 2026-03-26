"use client";

import { useState, useEffect, useRef } from "react";

interface TossBillingButtonProps {
  plan: string;
  amount: number;
  userId: string;
}

type TossPaymentInstance = Awaited<ReturnType<Awaited<ReturnType<typeof import("@tosspayments/tosspayments-sdk")["loadTossPayments"]>>["payment"]>>;

export default function TossBillingButton({ plan, userId }: TossBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentRef = useRef<TossPaymentInstance | null>(null);

  // 마운트 시 SDK 미리 로드 → 클릭 시 user gesture context 유지
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
        const tossPayments = await loadTossPayments(clientKey);
        if (!cancelled) {
          paymentRef.current = tossPayments.payment({ customerKey: userId });
        }
      } catch (e) {
        console.error("[Toss] SDK 초기화 실패:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleClick = async () => {
    if (!paymentRef.current) {
      setError("결제 모듈을 초기화 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await paymentRef.current.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/api/toss/billing/confirm?plan=${plan}`,
        failUrl: `${window.location.origin}/pricing?error=billing`,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "NO_CODE";
      const msg = (e as { message?: string }).message ?? String(e);
      console.error("[Toss] 빌링 오류 전체:", JSON.stringify(e, Object.getOwnPropertyNames(e as object)));
      setError(`[${code}] ${msg}`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 bg-[#3182F6] hover:bg-[#1B64DA] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            이동 중...
          </>
        ) : "토스페이먼츠 정기결제"}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center break-all">{error}</p>
      )}
    </div>
  );
}
