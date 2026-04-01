"use client";

import { useState } from "react";
import { PORTONE_PLANS, PortonePlanKey } from "@/lib/portone";

interface InicisButtonProps {
  plan: PortonePlanKey;
  userId: string;
  userEmail: string;
  userName: string;
}

export default function InicisButton({ plan, userId, userEmail, userName }: InicisButtonProps) {
  const [name, setName]   = useState(userName || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const storeId    = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY;

    if (!storeId || !channelKey) {
      alert("KG이니시스 채널키가 설정되지 않았습니다.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      alert("이름과 휴대폰 번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const { requestIssueBillingKey } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const issueId  = `ini_${userId.slice(-10)}_${Date.now().toString(36)}`;

      const response = await requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: "CARD",
        issueId,
        issueName: planData.orderName,
        amount: { total: planData.amount },
        customer: {
          customerId: userId,
          fullName:    name.trim(),
          phoneNumber: phone.trim(),
          email:       userEmail,
        },
      });

      if (!response || "code" in response) {
        const msg = response && "message" in response ? (response as { message: string }).message : "카드 등록에 실패했습니다.";
        alert(msg);
        return;
      }

      // billingKey 발급 성공 → 서버에서 즉시 결제
      const billingKey = (response as { billingKey: string }).billingKey;
      const confirmRes = await fetch("/api/portone/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, plan, customerName: name.trim(), customerPhone: phone.trim() }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        alert((err as { message?: string }).message || "결제에 실패했습니다.");
        return;
      }

      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error("[Inicis] 빌링키 발급 오류:", e);
      alert("카드 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors"
      >
        🏦 KG이니시스 카드 정기결제
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-800 rounded-xl p-4">
      <p className="text-white text-sm font-semibold">카드 정기결제 등록</p>
      <input
        type="text"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full px-3 py-2.5 rounded-lg bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-blue-500"
      />
      <input
        type="tel"
        placeholder="휴대폰 번호 (010-0000-0000)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        className="w-full px-3 py-2.5 rounded-lg bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-blue-500"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 py-2.5 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "카드 등록 및 결제"}
        </button>
      </div>
    </form>
  );
}
