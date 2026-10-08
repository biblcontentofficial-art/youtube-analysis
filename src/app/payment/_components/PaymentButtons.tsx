"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PORTONE_PLANS, PortonePlanKey } from "@/lib/portone";
import { buttonClass } from "@/components/ui/button";
import { inputClass, Label } from "@/components/ui/field";
import { WarningIcon } from "@/components/ui/icons";

type PayMethod = "card" | "kakao" | "toss";

interface Props {
  plan: PortonePlanKey;
  userId: string;
  userEmail: string;
  userName: string;
  period?: "monthly" | "yearly";
}

export default function PaymentButtons({ plan, userId, userEmail, userName, period = "yearly" }: Props) {
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<PayMethod | null>(null);
  const [loading, setLoading] = useState<PayMethod | null>(null);
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [payError, setPayError] = useState("");

  // 토스페이먼츠: 클라이언트 키가 있으면 활성화
  const tossEnabled = !!(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

  const handleSelect = (id: PayMethod) => {
    if (loading) return;
    if (id === "toss" && !tossEnabled) return; // 비활성 시 무시
    if (id === "kakao") return; // 카카오페이 일시 비활성
    if (id === "card") {
      setExpanded(expanded === id ? null : id);
      setFormError("");
    } else if (id === "toss") {
      handleTossPay();
    }
  };

  /* ── 카카오페이 ── */
  const handleKakaoPay = async () => {
    setPayError("");
    setLoading("kakao");
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY;
      console.log("[kakao] storeId:", storeId, "channelKey:", channelKey);
      if (!storeId || !channelKey) {
        setPayError("카카오페이 설정이 필요합니다. (환경변수 누락)");
        return;
      }
      const { requestIssueBillingKey } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const issueId = `kko_${userId.slice(-10)}_${Date.now().toString(36)}`;
      const redirectUrl = `${window.location.origin}/payment/success?plan=${plan}&pgType=kakaopay`;
      const displayAmount = period === "yearly" ? planData.yearlyAmount : planData.monthlyAmount;

      console.log("[kakao] requestIssueBillingKey 호출", { issueId, amount: displayAmount, period });

      const res = await requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: "EASY_PAY",
        issueId,
        issueName: planData.orderName + (period === "yearly" ? " (연간)" : " (월간)"),
        displayAmount,
        currency: "KRW",
        customer: {
          customerId: userId,
          fullName: userName || "고객",
          email: userEmail,
        },
        easyPay: { easyPayProvider: "KAKAOPAY" },
        redirectUrl,
      } as Parameters<typeof requestIssueBillingKey>[0]);

      console.log("[kakao] 응답:", res);

      if (!res) {
        setPayError("카카오페이 창이 닫혔거나 응답이 없습니다. 팝업 차단을 해제해주세요.");
        return;
      }
      if ("code" in res) {
        const err = res as { code?: string; message?: string };
        setPayError(`카카오페이 등록 실패\n${err.message || err.code || "알 수 없는 오류"}`);
        return;
      }
      const billingKey = (res as { billingKey: string }).billingKey;
      if (!billingKey) {
        setPayError("빌링키를 받지 못했습니다. 다시 시도해주세요.");
        return;
      }
      const confirmRes = await fetch("/api/portone/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, plan, period, pgType: "kakaopay", customerName: userName, customerEmail: userEmail }),
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        setPayError((err as { message?: string }).message || "결제 승인 실패");
        return;
      }
      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error("[kakao] 결제 오류:", e);
      setPayError(`카카오페이 결제 중 오류가 발생했습니다.\n${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  /* ── 토스페이먼츠: 전용 결제 페이지로 이동 ── */
  const handleTossPay = () => {
    window.location.href = `/payment/toss?plan=${plan}&period=${period}`;
  };

  /* ── 신용·체크카드 (KG이니시스 기본 / ?cardpg=kcp → NHN KCP) ── */
  const handleCardPay = async () => {
    if (!name.trim() || !phone.trim()) { setFormError("이름과 휴대폰 번호를 입력해주세요."); return; }
    setFormError("");
    setPayError("");
    setLoading("card");
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const cardPg = searchParams.get("cardpg");
      const isKcp = cardPg === "kcp";
      const isDanal = cardPg === "danal";
      const channelKey = isKcp
        ? process.env.NEXT_PUBLIC_PORTONE_KCP_CHANNEL_KEY
        : isDanal
          ? process.env.NEXT_PUBLIC_PORTONE_DANAL_CHANNEL_KEY
          : process.env.NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY;

      if (!storeId || !channelKey) { setPayError("결제 채널 설정이 필요합니다."); return; }

      const { requestIssueBillingKey } = await import("@portone/browser-sdk/v2");
      const planData = PORTONE_PLANS[plan];
      const prefix = isKcp ? "kcp" : isDanal ? "danal" : "ini";
      const issueId = `${prefix}_${userId.slice(-10)}_${Date.now().toString(36)}`;
      // period에 따라 표시 금액 결정
      const displayAmount = period === "yearly" ? planData.yearlyAmount : planData.monthlyAmount;

      const res = await requestIssueBillingKey({
        storeId, channelKey, billingKeyMethod: "CARD",
        issueId, issueName: planData.orderName + (period === "yearly" ? " (연간)" : " (월간)"),
        displayAmount,
        currency: "KRW",
        customer: { customerId: userId, fullName: name.trim(), phoneNumber: phone.trim(), email: userEmail },
      } as Parameters<typeof requestIssueBillingKey>[0]);
      if (!res || "code" in res) { setPayError((res as { message?: string })?.message || "카드 등록 실패"); return; }
      const billingKey = (res as { billingKey: string }).billingKey;
      const confirmRes = await fetch("/api/portone/billing/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, plan, period, customerName: name.trim(), customerPhone: phone.trim() }),
      });
      if (!confirmRes.ok) { const err = await confirmRes.json().catch(() => ({})); setPayError((err as { message?: string }).message || "결제 실패"); return; }
      window.location.href = "/search?upgraded=1";
    } catch (e) {
      console.error("[card] 카드 등록 오류:", e);
      setPayError("카드 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  };

  /* ── 결제수단 목록 (토스페이먼츠 활성, 나머지 심사 준비중) ── */
  const methods: {
    id: PayMethod;
    name: string;
    desc: string;
    preparing?: boolean;
  }[] = [
    {
      id: "toss",
      name: "토스페이먼츠",
      desc: "신용·체크카드 간편결제 (우리카드 제외)",
    },
    {
      id: "card",
      name: "신용·체크카드",
      desc: "정기결제 (자동결제)",
    },
    {
      id: "kakao",
      name: "카카오페이",
      desc: "카카오 계정으로 간편 결제",
      preparing: true,
    },
  ];

  return (
    <div>
      <div className="space-y-2">
      {methods.map((method) => {
        const isCard = method.id === "card";
        const isExpanded = isCard && expanded === "card";
        const isLoading = loading === method.id;
        const isPreparing = method.preparing;

        return (
          <div key={method.id}>
            <button
              type="button"
              onClick={() => handleSelect(method.id)}
              disabled={!!loading || isPreparing}
              aria-disabled={isPreparing || undefined}
              aria-expanded={isCard ? isExpanded : undefined}
              className={`flex min-h-[68px] w-full items-center gap-3.5 rounded-control border px-4 py-3.5 text-left transition-colors duration-150
                ${isExpanded
                  ? "border-accent bg-surface-2"
                  : isPreparing
                    ? "border-line bg-surface"
                    : "border-line-strong bg-surface hover:border-line-hover hover:bg-surface-2"
                } ${isLoading ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"}`}
            >
              <span className="min-w-0 flex-1">
                <span className={`block text-ui font-semibold ${isPreparing ? "text-fg-3" : "text-fg"}`}>
                  {method.name}
                </span>
                <span className={`mt-0.5 block text-caption ${isPreparing ? "text-fg-4" : "text-fg-3"}`}>
                  {method.desc}
                </span>
              </span>
              {isLoading ? (
                <span aria-hidden="true" className="size-4 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-fg" />
              ) : isPreparing ? (
                <span className="inline-flex shrink-0 items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-3">준비중</span>
              ) : (
                <svg aria-hidden="true" className={`size-4 shrink-0 text-fg-3 transition-transform ${isCard ? (isExpanded ? "-rotate-90" : "rotate-90") : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* 카드 정보 입력 폼 */}
            {isCard && isExpanded && (
              <div className="mt-2 space-y-3 rounded-control border border-line bg-surface-2 p-4">
                <div>
                  <Label htmlFor="pay-name">이름</Label>
                  <input
                    id="pay-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass({ inset: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="pay-phone">휴대폰 번호</Label>
                  <input
                    id="pay-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass({ inset: true })}
                  />
                </div>
                {formError && <p role="alert" className="text-micro text-negative">{formError}</p>}
                <button
                  type="button"
                  onClick={handleCardPay}
                  disabled={!!loading}
                  aria-busy={isLoading || undefined}
                  className={buttonClass({ block: true })}
                >
                  {isLoading ? (
                    <><span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />처리 중...</>
                  ) : "카드 등록 및 결제"}
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* 결제 실패 안내(목록 아래) */}
      {payError && (
        <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-card border border-negative/55 px-4 py-3">
          <WarningIcon size={16} className="mt-0.5 text-negative" />
          <p className="whitespace-pre-line text-body-sm text-fg-1">{payError}</p>
        </div>
      )}
    </div>
  );
}
