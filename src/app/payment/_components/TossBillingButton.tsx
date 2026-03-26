"use client";

import { useState } from "react";

interface TossBillingButtonProps {
  plan: string;
  amount: number;
  userId: string;
}

export default function TossBillingButton({ plan, userId }: TossBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: userId });
      await payment.requestBillingAuth({
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
