"use client";

import { useEffect, useRef, useState } from "react";
import { WarningIcon } from "@/components/ui/icons";

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
        // v2 SDK: @tosspayments/tosspayments-sdk
        // @docs https://docs.tosspayments.com/sdk/v2/js
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const tossPayments = await loadTossPayments(clientKey);

        if (cancelled) return;

        // 결제위젯 인스턴스 생성
        const widget = tossPayments.widgets({ customerKey });

        // 결제 금액 설정
        await widget.setAmount({ currency: "KRW", value: amount });

        if (cancelled) return;

        // 결제수단 UI 렌더링
        await widget.renderPaymentMethods({
          selector: "#toss-payment-method",
          variantKey: "DEFAULT",
        });

        // 이용약관 UI 렌더링
        await widget.renderAgreement({ selector: "#toss-payment-agreement" });

        widgetRef.current = widget;
        setReady(true);
      } catch (e) {
        console.error("[Toss Widget v2] 초기화 실패:", e);
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
        <div className="mb-4 flex items-center gap-2 rounded-card border border-caution/55 px-4 py-3 text-body-sm text-caution">
          <WarningIcon size={16} className="shrink-0" />
          테스트 환경 · 실제로 결제되지 않습니다
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-card border border-negative/55 px-4 py-3 text-body-sm text-fg-1">
          <WarningIcon size={16} className="mt-0.5 shrink-0 text-negative" />
          {error}
        </div>
      )}

      {/* 결제수단 UI (v2: renderPaymentMethods) */}
      <div id="toss-payment-method" className="min-h-[200px]">
        {!ready && (
          <div className="flex items-center justify-center h-[200px]">
            <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-fg" />
          </div>
        )}
      </div>

      {/* 이용약관 UI (v2: renderAgreement) */}
      <div id="toss-payment-agreement" />

      {/* 결제 버튼 */}
      <button
        onClick={handlePay}
        disabled={!ready || paying}
        className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-control bg-accent px-7 text-body font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active disabled:opacity-40"
      >
        {paying ? (
          <>
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
            처리 중...
          </>
        ) : (
          `₩${amount.toLocaleString()} 결제하기`
        )}
      </button>

      <p className="mt-3 text-center text-caption text-fg-3">
        언제든 해지 가능 · SSL 보안 결제
      </p>
    </div>
  );
}
