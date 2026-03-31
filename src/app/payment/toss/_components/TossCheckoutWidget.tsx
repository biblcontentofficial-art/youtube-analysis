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
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetsRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey });

        await widgets.setAmount({ currency: "KRW", value: amount });

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#toss-payment-methods",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#toss-agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        if (!cancelled) {
          widgetsRef.current = widgets;
          setReady(true);
        }
      } catch (e) {
        console.error("[Toss] 위젯 초기화 실패:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [clientKey, customerKey, amount]);

  const handlePay = async () => {
    if (!widgetsRef.current || paying) return;
    setPaying(true);
    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
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
      {/* 위젯 영역: 토스가 여기에 UI를 직접 주입 */}
      <div id="toss-payment-methods" className="w-full" />
      <div id="toss-agreement" className="w-full mt-3" />

      {/* 로딩 스켈레톤 */}
      {!ready && (
        <div className="space-y-3 mt-4 animate-pulse">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      )}

      {/* 결제 버튼 */}
      {ready && (
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full mt-5 py-4 bg-[#3182F6] hover:bg-[#1b6ef3] disabled:opacity-60 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {paying ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              처리 중...
            </>
          ) : (
            `₩${amount.toLocaleString()} 결제하기`
          )}
        </button>
      )}
    </div>
  );
}
