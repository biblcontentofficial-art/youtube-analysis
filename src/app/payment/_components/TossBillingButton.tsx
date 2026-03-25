"use client";

import { useEffect, useRef, useState } from "react";

/* Toss Payments JS SDK v1 글로벌 타입 선언 */
declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestBillingAuth: (
        method: string,
        params: {
          customerKey: string;
          successUrl: string;
          failUrl: string;
        }
      ) => void;
    };
  }
}

interface TossBillingButtonProps {
  plan: string;
  amount: number;
  userId: string;
}

export default function TossBillingButton({ plan, amount, userId }: TossBillingButtonProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const scriptRef = useRef(false);

  // ── Toss Payments JS SDK CDN 로드 ──────────────────────────────────
  useEffect(() => {
    if (scriptRef.current) return;
    scriptRef.current = true;

    if (typeof window !== "undefined" && typeof window.TossPayments !== "undefined") {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.error("[TossBilling] SDK 로드 실패");
    document.head.appendChild(script);
  }, []);

  const handleClick = () => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      alert(
        "토스 결제 키가 설정되지 않았습니다.\n" +
        ".env.local에 NEXT_PUBLIC_TOSS_CLIENT_KEY를 추가해주세요."
      );
      return;
    }

    if (!sdkReady || typeof window.TossPayments === "undefined") {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);

    try {
      const tossPayments = window.TossPayments(clientKey);

      // 정기결제용 카드 등록 창 오픈
      // successUrl에서 authKey + customerKey 받아서 빌링키 발급 후 결제
      tossPayments.requestBillingAuth("카드", {
        customerKey: userId,
        successUrl: `${window.location.origin}/api/toss/billing/confirm?plan=${plan}`,
        failUrl: `${window.location.origin}/pricing?error=billing`,
      });
    } catch (e) {
      console.error("[TossBilling] requestBillingAuth 오류:", e);
      alert("결제창을 여는 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full py-3 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          결제창 여는 중...
        </>
      ) : "토스페이먼츠 정기결제"}
    </button>
  );
}
