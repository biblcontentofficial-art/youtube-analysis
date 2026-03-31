"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  plan: string;
}

type Method = "카드" | "토스페이";

const METHODS: { id: Method; label: string; logo: React.ReactNode }[] = [
  {
    id: "카드",
    label: "신용·체크카드",
    logo: (
      <svg viewBox="0 0 36 24" className="w-9 h-6" fill="none">
        <rect width="36" height="24" rx="4" fill="#F0F4FF" />
        <rect x="4" y="8" width="8" height="6" rx="1" fill="#3182F6" />
        <rect x="4" y="16" width="4" height="2" rx="0.5" fill="#AEC6FB" />
        <rect x="10" y="16" width="4" height="2" rx="0.5" fill="#AEC6FB" />
        <rect x="24" y="7" width="8" height="10" rx="1" fill="#E8EEFF" />
      </svg>
    ),
  },
  {
    id: "토스페이",
    label: "toss pay",
    logo: (
      <svg viewBox="0 0 48 20" className="w-14 h-5" fill="none">
        <text
          x="0" y="16"
          fontFamily="sans-serif"
          fontWeight="800"
          fontSize="16"
          fill="#3182F6"
          letterSpacing="-0.5"
        >
          toss
        </text>
        <text
          x="33" y="16"
          fontFamily="sans-serif"
          fontWeight="700"
          fontSize="13"
          fill="#3182F6"
        >
          pay
        </text>
      </svg>
    ),
  },
];

export default function TossCheckoutWidget({
  clientKey,
  customerKey,
  amount,
  orderId,
  orderName,
  customerEmail,
  customerName,
  plan,
}: Props) {
  const [selected, setSelected] = useState<Method>("카드");
  const [paying, setPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const tp = await loadTossPayments(clientKey);
        if (!cancelled) {
          paymentRef.current = tp.payment({ customerKey });
          setSdkReady(true);
        }
      } catch (e) {
        console.error("[Toss] SDK 초기화 실패:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [clientKey, customerKey]);

  const handlePay = async () => {
    if (!paymentRef.current || paying) return;
    setPaying(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (paymentRef.current as any).requestPayment({
        method: selected,
        orderId,
        orderName,
        amount: { currency: "KRW" as const, value: amount },
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
        successUrl: `${window.location.origin}/api/toss/confirm?plan=${plan}`,
        failUrl: `${window.location.origin}/pricing?error=payment`,
      });
    } catch (e) {
      console.error("[Toss] 결제 실패:", e);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="w-full">
      {/* 테스트 환경 배너 */}
      {process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.startsWith("test_") && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-amber-700 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          테스트 환경 · 실제로 결제되지 않습니다
        </div>
      )}

      {/* 결제 방법 */}
      <p className="text-sm font-semibold text-gray-700 mb-3">결제 방법</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${
              selected === m.id
                ? "border-[#3182F6] bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {m.logo}
            <span className="text-xs font-medium text-gray-600">{m.label}</span>
          </button>
        ))}
      </div>

      {/* 약관 동의 */}
      <div className="flex items-center gap-2 px-1 mb-5">
        <svg className="w-4 h-4 text-[#3182F6] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-gray-500">[필수] 결제 서비스 이용 약관, 개인정보 처리 동의</span>
      </div>

      {/* 결제 버튼 */}
      <button
        onClick={handlePay}
        disabled={!sdkReady || paying}
        className="w-full py-4 bg-[#3182F6] hover:bg-[#1b6ef3] disabled:opacity-50 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {!sdkReady ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            로딩 중...
          </>
        ) : paying ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            처리 중...
          </>
        ) : (
          `₩${amount.toLocaleString()} 결제하기`
        )}
      </button>

      {/* 신용카드 무이자 안내 */}
      {selected === "카드" && (
        <p className="text-center text-xs text-gray-400 mt-3">
          신한카드 최대 3개월 무이자 할부
        </p>
      )}
    </div>
  );
}
