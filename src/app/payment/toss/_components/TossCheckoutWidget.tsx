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
  orderName,
  customerEmail,
  customerName,
  plan,
}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentInstanceRef = useRef<any>(null);

  // 1) SDK 로드 + payment 인스턴스 생성 (공식 샘플 방식: 페이지 로드 시 1회)
  useEffect(() => {
    let cancelled = false;

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.onload = () => {
      if (cancelled) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tp = (window as any).TossPayments(clientKey);
        paymentInstanceRef.current = tp.payment({ customerKey });
        setSdkReady(true);
        console.log("[Toss] SDK 초기화 완료");
      } catch (e) {
        console.error("[Toss] SDK 초기화 실패:", e);
        if (!cancelled) setError("결제 모듈 초기화에 실패했습니다.");
      }
    };
    script.onerror = () => {
      if (!cancelled) setError("결제 모듈 로드에 실패했습니다.");
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientKey, customerKey]);

  // 2) 네이티브 click 리스너로 requestBillingAuth 호출
  //    React 합성 이벤트 대신 네이티브 이벤트를 사용해야
  //    브라우저가 사용자 제스처로 인식 → 팝업/iframe 허용
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn || !sdkReady) return;

    const handler = async () => {
      const payment = paymentInstanceRef.current;
      if (!payment) return;

      try {
        console.log("[Toss] requestBillingAuth 호출...");
        await payment.requestBillingAuth({
          method: "CARD",
          successUrl: `${window.location.origin}/api/toss/billing/confirm?plan=${plan}`,
          failUrl: `${window.location.origin}/pricing?error=billing`,
          customerEmail: customerEmail || undefined,
          customerName: customerName || undefined,
        });
        // 성공 시 successUrl로 리다이렉트되므로 여기까지 오지 않음
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        const code = err?.code ?? "";
        const msg = err?.message ?? "알 수 없는 에러가 발생했습니다.";
        console.error("[Toss] requestBillingAuth 에러:", code, msg, e);

        if (code === "USER_CANCEL" || code === "PAY_PROCESS_CANCELED") return;
        setError(`결제 오류 [${code || "UNKNOWN"}]: ${msg}`);
      }
    };

    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, [sdkReady, plan, customerEmail, customerName]);

  return (
    <div className="w-full">
      {/* 테스트 환경 배너 */}
      {clientKey.startsWith("test_") && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-amber-700 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          테스트 환경 · 실제로 결제되지 않습니다
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* 결제 안내 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#3182F6] rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">신용·체크카드 정기결제</p>
            <p className="text-gray-500 text-xs mt-0.5">카드 등록 후 매월 자동 결제</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{orderName}</span>
            <span className="font-bold text-gray-900">₩{amount.toLocaleString()}/월</span>
          </div>
        </div>
      </div>

      {/* 약관 동의 */}
      <div className="flex items-center gap-2 px-1 mb-5">
        <svg className="w-4 h-4 text-[#3182F6] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-gray-500">[필수] 결제 서비스 이용 약관, 개인정보 처리 동의</span>
      </div>

      {/* 결제 버튼 - React onClick 대신 네이티브 이벤트 리스너 사용 */}
      <button
        ref={btnRef}
        disabled={!sdkReady}
        className="w-full py-4 bg-[#3182F6] hover:bg-[#1b6ef3] disabled:opacity-50 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {!sdkReady ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            로딩 중...
          </>
        ) : (
          `카드 등록 후 ₩${amount.toLocaleString()} 결제`
        )}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        언제든지 해지 가능
      </p>
    </div>
  );
}
