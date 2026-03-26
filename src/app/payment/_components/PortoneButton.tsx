"use client";

import { useState } from "react";
import { PORTONE_PLANS, PortonePlanKey, PORTONE_STORE_ID, PORTONE_KAKAOPAY_CHANNEL_KEY, PORTONE_KCP_CHANNEL_KEY } from "@/lib/portone";

interface PortoneButtonProps {
  plan: PortonePlanKey;
  userId: string;
  userEmail: string;
  userName?: string;
}

type PayOption = {
  key: string;
  label: string;
  channelKeyEnv: () => string;
  billingKeyMethod: "EASY_PAY" | "CARD";
  easyPayProvider?: "KAKAOPAY" | "NAVERPAY";
  bg: string;
  text: string;
};

const PAY_OPTIONS: PayOption[] = [
  {
    key: "KAKAOPAY",
    label: "카카오페이",
    channelKeyEnv: () => PORTONE_KAKAOPAY_CHANNEL_KEY,
    billingKeyMethod: "EASY_PAY",
    easyPayProvider: "KAKAOPAY",
    bg: "bg-[#FEE500] hover:bg-[#F0D900]",
    text: "text-black",
  },
  // NAVERPAY: 파트너센터 연동 전까지 비활성화
  // {
  //   key: "NAVERPAY",
  //   label: "네이버페이",
  //   channelKeyEnv: () => PORTONE_NAVERPAY_CHANNEL_KEY,
  //   billingKeyMethod: "EASY_PAY",
  //   easyPayProvider: "NAVERPAY",
  //   bg: "bg-[#03C75A] hover:bg-[#02B050]",
  //   text: "text-white",
  // },
  {
    key: "CARD",
    label: "신용카드",
    channelKeyEnv: () => PORTONE_KCP_CHANNEL_KEY,
    billingKeyMethod: "CARD",
    bg: "bg-gray-800 hover:bg-gray-700 border border-gray-700",
    text: "text-gray-200",
  },
];

export default function PortoneButton({ plan, userId, userEmail, userName }: PortoneButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePay = async (option: PayOption) => {
    const storeId    = PORTONE_STORE_ID;
    const channelKey = option.channelKeyEnv();

    if (!storeId || !channelKey) {
      alert("포트원 설정이 필요합니다. (채널키 미설정)");
      return;
    }

    setLoading(option.key);
    try {
      const { requestIssueBillingKey } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const issueId  = `portone_${option.key.toLowerCase()}_${userId}_${plan}_${Date.now()}`;

      const billingKeyRequest = {
        storeId,
        channelKey,
        billingKeyMethod: option.billingKeyMethod,
        issueId,
        issueName: planData.orderName,
        customer: {
          customerId:  userId,
          fullName:    userName || "고객",
          email:       userEmail,
        },
        ...(option.easyPayProvider && {
          easyPay: { easyPayProvider: option.easyPayProvider },
        }),
      } as Parameters<typeof requestIssueBillingKey>[0];

      const response = await requestIssueBillingKey(billingKeyRequest);

      if (!response || "code" in response) {
        const msg = response && "message" in response
          ? (response as { message: string }).message
          : "카드 등록에 실패했습니다.";
        alert(msg);
        return;
      }

      const billingKey = (response as { billingKey: string }).billingKey;

      const confirmRes = await fetch("/api/portone/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingKey,
          plan,
          pgType: option.key.toLowerCase(),
          customerName: userName || "고객",
          customerEmail: userEmail,
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        alert((err as { message?: string }).message || "결제에 실패했습니다.");
        return;
      }

      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error(`[PortOne ${option.key}] 오류:`, e);
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
          className={`w-full py-3 rounded-xl text-sm font-semibold ${option.bg} ${option.text} disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
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
