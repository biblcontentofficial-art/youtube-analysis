"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  plan: string;
  customerEmail?: string;
  customerName?: string;
}

export default function TossPaymentWidget({
  clientKey, customerKey, amount, orderId, orderName,
  plan, customerEmail, customerName,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadPaymentWidget } = await import("@tosspayments/payment-widget-sdk");
        const widget = await loadPaymentWidget(clientKey, customerKey);
        if (!cancelled) {
          widgetRef.current = widget;
          widget.renderPaymentMethods("#toss-payment-method", { value: amount });
          widget.renderAgreement("#toss-payment-agreement");
          setReady(true);
        }
      } catch (e) {
        console.error("[Toss Widget] 초기화 실패:", e);
        if (!cancelled) setError("결제 모듈 초기화에 실패했습니다.");
      }
    })();
    return () => { cancelled = true; };
  }, [clientKey, customerKey, amount]);

  const handlePay = async () => {
    if (!widgetRef.current || paying || !ready) return;
    setError(null);
    setPaying(true);
    try {
      await widgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/api/toss/widget/confirm?plan=${plan}`,
        failUrl: `${window.location.origin}/payment/toss/fail`,
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string } | null;
      const code = err?.code ?? "";
      if (code === "USER_CANCEL" || code === "PAY_PROCESS_CANCELED") {
        setPaying(false);
        return;
      }
      setError(`결제 오류 [${code || "UNKNOWN"}]: ${err?.message ?? String(e)}`);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="w-full">
      {clientKey.startsWith("test_") && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-amber-700 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          테스트 환경 · 실제로 결제되지 않습니다
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* 결제수단 UI */}
      <div id="toss-payment-method" className="min-h-[200px]">
        {!ready && (
          <div className="flex items-center justify-center h-[200px]">
            <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 약관 동의 UI */}
      <div id="toss-payment-agreement" />

      {/* 결제 버튼 */}
      <button
        onClick={handlePay}
        disabled={!ready || paying}
        className="w-full mt-4 py-4 bg-[#3182F6] hover:bg-[#1b6ef3] disabled:opacity-50 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            처리 중...
          </>
        ) : (
          `₩${amount.toLocaleString()} 결제하기`
        )}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        언제든 해지 가능 · SSL 보안 결제
      </p>
    </div>
  );
}
