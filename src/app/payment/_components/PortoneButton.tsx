"use client";

import { useState } from "react";
import { PORTONE_PLANS, PortonePlanKey } from "@/lib/portone";

interface PortoneButtonProps {
  plan: PortonePlanKey;
  userId: string;
  userEmail: string;
}

type PayOption = {
  key: string;
  label: string;
  method: "EASY_PAY" | "CARD";
  provider?: "KAKAOPAY" | "NAVERPAY";
};

const PAY_OPTIONS: PayOption[] = [
  { key: "KAKAOPAY", label: "카카오페이", method: "EASY_PAY", provider: "KAKAOPAY" },
  { key: "NAVERPAY", label: "네이버페이", method: "EASY_PAY", provider: "NAVERPAY" },
  { key: "CARD",     label: "신용카드",   method: "CARD" },
];

export default function PortoneButton({ plan, userId, userEmail }: PortoneButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePay = async (option: PayOption) => {
    const storeId    = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

    if (!storeId || !channelKey) {
      alert("포트원 설정이 필요합니다.");
      return;
    }

    setLoading(option.key);
    try {
      const { requestPayment } = await import("@portone/browser-sdk/v2");
      const planData  = PORTONE_PLANS[plan];
      const paymentId = `portone_${userId}_${plan}_${Date.now()}`;

      const base = {
        storeId,
        paymentId,
        channelKey,
        orderName: planData.orderName,
        totalAmount: planData.amount,
        currency: "KRW" as const,
        customer: { customerId: userId, email: userEmail },
        redirectUrl: `${window.location.origin}/api/portone/confirm?plan=${plan}&paymentId=${paymentId}`,
      };

      const response = await requestPayment(
        option.method === "EASY_PAY" && option.provider
          ? { ...base, payMethod: "EASY_PAY", easyPay: { easyPayProvider: option.provider } }
          : { ...base, payMethod: "CARD" }
      );

      if (!response || "code" in response) {
        alert(("message" in (response ?? {})) ? (response as { message: string }).message : "결제에 실패했습니다.");
        return;
      }

      const confirmRes = await fetch(`/api/portone/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, plan }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        alert((err as { message?: string }).message || "결제 검증에 실패했습니다.");
        return;
      }

      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error("[PortOne] 결제 오류:", e);
      alert("결제 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {PAY_OPTIONS.map((option) => (
        <button
          key={option.key}
          onClick={() => handlePay(option)}
          disabled={loading !== null}
          className="w-full py-3 rounded-xl text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading === option.key ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : null}
          {loading === option.key ? "결제창 여는 중..." : option.label}
        </button>
      ))}
    </>
  );
}
