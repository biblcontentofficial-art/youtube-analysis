"use client";

import { useState } from "react";
import { PORTONE_PLANS, PortonePlanKey } from "@/lib/portone";

interface PortoneButtonProps {
  plan: PortonePlanKey;
  userId: string;
  userEmail: string;
}

type PayOption =
  | { method: "EASY_PAY"; provider: "KAKAOPAY"; label: string; icon: string; bg: string; textColor: string }
  | { method: "EASY_PAY"; provider: "NAVERPAY"; label: string; icon: string; bg: string; textColor: string }
  | { method: "CARD";     provider: null;        label: string; icon: string; bg: string; textColor: string };

const PAY_OPTIONS: PayOption[] = [
  { method: "EASY_PAY", provider: "KAKAOPAY", label: "카카오페이", icon: "💛", bg: "bg-[#FEE500]", textColor: "text-black" },
  { method: "EASY_PAY", provider: "NAVERPAY", label: "네이버페이", icon: "🟢", bg: "bg-[#03C75A]", textColor: "text-white" },
  { method: "CARD",     provider: null,       label: "신용카드",   icon: "💳", bg: "bg-gray-700",  textColor: "text-white" },
];

type LoadingKey = "KAKAOPAY" | "NAVERPAY" | "CARD" | null;

export default function PortoneButton({ plan, userId, userEmail }: PortoneButtonProps) {
  const [loading, setLoading] = useState<LoadingKey>(null);

  const handlePay = async (option: PayOption) => {
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

    if (!storeId || !channelKey) {
      alert("포트원 설정이 필요합니다.");
      return;
    }

    const key: LoadingKey = option.provider ?? "CARD";
    setLoading(key);

    try {
      const { requestPayment } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const paymentId = `portone_${userId}_${plan}_${Date.now()}`;

      const baseParams = {
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
        option.method === "EASY_PAY"
          ? { ...baseParams, payMethod: "EASY_PAY", easyPay: { easyPayProvider: option.provider } }
          : { ...baseParams, payMethod: "CARD" }
      );

      if (!response || "code" in response) {
        console.error("[PortOne] 결제 실패:", response);
        alert(("message" in (response ?? {})) ? (response as { message: string }).message : "결제에 실패했습니다.");
        return;
      }

      // 팝업 결제 성공 시 서버 검증
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
    <div className="space-y-2">
      {PAY_OPTIONS.map((option) => {
        const key: LoadingKey = option.provider ?? "CARD";
        return (
          <button
            key={key}
            onClick={() => handlePay(option)}
            disabled={loading !== null}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity ${option.bg} ${option.textColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading === key ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{option.icon}</span>
            )}
            {loading === key ? "결제창 여는 중..." : `${option.label}로 결제`}
          </button>
        );
      })}
    </div>
  );
}
