"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PORTONE_PLANS, PortonePlanKey } from "@/lib/portone";

type PayMethod = "card" | "kakao";

interface Props {
  plan: PortonePlanKey;
  userId: string;
  userEmail: string;
  userName: string;
}

const METHODS: {
  id: PayMethod;
  name: string;
  desc: string;
  logo: React.ReactNode;
  needsForm?: boolean;
}[] = [
  {
    id: "card",
    name: "신용·체크카드",
    desc: "정기결제 (자동결제)",
    needsForm: true,
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6">
        <rect width="40" height="40" rx="8" fill="#3B82F6" />
        <path d="M10 16h20M10 14a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H12a2 2 0 01-2-2V14z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="21" width="5" height="3" rx="0.5" fill="white" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "kakao",
    name: "카카오페이",
    desc: "카카오 계정으로 간편 결제",
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6">
        <rect width="40" height="40" rx="8" fill="#FEE500" />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#3C1E1E" fontSize="14" fontWeight="bold" fontFamily="sans-serif">K</text>
      </svg>
    ),
  },
];

export default function PaymentButtons({ plan, userId, userEmail, userName }: Props) {
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<PayMethod | null>(null);
  const [loading, setLoading] = useState<PayMethod | null>(null);
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  const handleSelect = (id: PayMethod) => {
    if (loading) return;
    const method = METHODS.find((m) => m.id === id)!;
    if (method.needsForm) {
      setExpanded(expanded === id ? null : id);
      setFormError("");
    } else {
      handleKakaoPay();
    }
  };

  /* ── 카카오페이 ── */
  const handleKakaoPay = async () => {
    setLoading("kakao");
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY;
      if (!storeId || !channelKey) { alert("카카오페이 설정이 필요합니다."); return; }
      const { requestIssueBillingKey } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const issueId = `kko_${userId.slice(-10)}_${Date.now().toString(36)}`;
      const res = await requestIssueBillingKey({
        storeId, channelKey,
        billingKeyMethod: "EASY_PAY",
        issueId, issueName: planData.orderName,
        customer: { customerId: userId, fullName: userName || "고객", email: userEmail },
        easyPay: { easyPayProvider: "KAKAOPAY" },
      } as Parameters<typeof requestIssueBillingKey>[0]);
      if (!res || "code" in res) { alert((res as { message?: string })?.message || "카카오페이 등록 실패"); return; }
      const billingKey = (res as { billingKey: string }).billingKey;
      const confirmRes = await fetch("/api/portone/billing/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, plan, pgType: "kakaopay", customerName: userName, customerEmail: userEmail }),
      });
      if (!confirmRes.ok) { const err = await confirmRes.json().catch(() => ({})); alert((err as { message?: string }).message || "결제 실패"); return; }
      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error("[kakao] 결제 오류:", e);
    } finally {
      setLoading(null);
    }
  };

  /* ── 신용·체크카드 (KG이니시스 기본 / ?cardpg=kcp 시 NHN KCP) ── */
  const handleCardPay = async () => {
    if (!name.trim() || !phone.trim()) { setFormError("이름과 휴대폰 번호를 입력해주세요."); return; }
    setFormError("");
    setLoading("card");
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;

      // PG 심사용: ?cardpg=kcp → NHN KCP, 기본값 → KG이니시스
      const cardPg = searchParams.get("cardpg");
      const isKcp = cardPg === "kcp";
      const channelKey = isKcp
        ? process.env.NEXT_PUBLIC_PORTONE_KCP_CHANNEL_KEY
        : process.env.NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY;

      if (!storeId || !channelKey) { alert("결제 채널 설정이 필요합니다."); return; }

      const { requestIssueBillingKey } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const prefix = isKcp ? "kcp" : "ini";
      const issueId = `${prefix}_${userId.slice(-10)}_${Date.now().toString(36)}`;

      const res = await requestIssueBillingKey({
        storeId, channelKey, billingKeyMethod: "CARD",
        issueId, issueName: planData.orderName,
        customer: { customerId: userId, fullName: name.trim(), phoneNumber: phone.trim(), email: userEmail },
      });
      if (!res || "code" in res) { alert((res as { message?: string })?.message || "카드 등록 실패"); return; }
      const billingKey = (res as { billingKey: string }).billingKey;
      const confirmRes = await fetch("/api/portone/billing/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, plan, customerName: name.trim(), customerPhone: phone.trim() }),
      });
      if (!confirmRes.ok) { const err = await confirmRes.json().catch(() => ({})); alert((err as { message?: string }).message || "결제 실패"); return; }
      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error("[card] 카드 등록 오류:", e);
      alert("카드 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {METHODS.map((method) => {
        const isExpanded = expanded === method.id;
        const isLoading = loading === method.id;

        return (
          <div key={method.id}>
            <button
              type="button"
              onClick={() => handleSelect(method.id)}
              disabled={!!loading}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 text-left
                ${isExpanded
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/80 hover:border-gray-600"
                } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="flex-shrink-0">{method.logo}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-white">{method.name}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{method.desc}</span>
              </span>
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : method.needsForm ? (
                <svg
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* 카드 정보 입력 폼 */}
            {method.needsForm && isExpanded && (
              <div className="mt-1 px-4 py-4 bg-gray-800/60 rounded-xl border border-gray-700/60 space-y-2.5">
                <input
                  type="text"
                  placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-700/60 border border-gray-600/60 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="tel"
                  placeholder="휴대폰 번호 (01012345678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-700/60 border border-gray-600/60 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {formError && <p className="text-red-400 text-xs">{formError}</p>}
                <button
                  type="button"
                  onClick={handleCardPay}
                  disabled={!!loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />처리 중...</>
                  ) : "카드 등록 및 결제"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
