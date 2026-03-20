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
      className="w-full py-4 bg-[#3182F6] hover:bg-[#1B64DA] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition text-base flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          결제창 여는 중...
        </>
      ) : (
        <>
          <TossIcon />
          토스 정기결제 카드 등록 &nbsp;₩{amount.toLocaleString()}
        </>
      )}
    </button>
  );
}

function TossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="white" fillOpacity="0.15" />
      <path
        d="M62 100 C62 78.5 79.5 61 101 61 C114 61 125.5 67.5 133 77.5"
        stroke="white" strokeWidth="16" strokeLinecap="round" fill="none"
      />
      <path
        d="M140 100 C140 121.5 122.5 139 101 139 C88 139 76.5 132.5 69 122.5"
        stroke="white" strokeWidth="16" strokeLinecap="round" fill="none"
      />
      <circle cx="135" cy="65" r="13" fill="white" />
      <circle cx="67" cy="135" r="13" fill="white" />
    </svg>
  );
}
