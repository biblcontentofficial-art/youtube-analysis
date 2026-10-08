"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type PricingButtonProps = {
  plan: string; // 'free' | 'starter' | 'pro' | 'business'
  cta: string;
  className: string;
  period?: "monthly" | "yearly";
  /** 로그인 여부(PricingCards 가 한 번 확인해 내려 준다). null 이면 아직 확인 전 */
  signedIn: boolean | null;
};

/**
 * 요금제 CTA. 이동 경로는 그대로다(무료 → /sign-up, 비로그인 유료 → 로그인, 로그인 유료 → /payment).
 * 인증 확인 전에도 정상 모양으로 그리고, 확인 전에 누르면 그 자리에서 한 번 확인한 뒤 판단한다.
 */
export default function PricingButton({ plan, cta, className, period = "yearly", signedIn }: PricingButtonProps) {
  const router = useRouter();
  // 확인 중 두 번 눌러도 한 번만 이동한다(이동 경로는 같다)
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (pending.current) return;
    if (plan === "free") {
      router.push("/sign-up");
      return;
    }

    let isSignedIn = signedIn;
    if (isSignedIn === null) {
      pending.current = true;
      setBusy(true);
      try {
        const { data } = await createSupabaseBrowser().auth.getUser();
        isSignedIn = !!data.user;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/pricing");
      return;
    }

    router.push(`/payment?plan=${plan}&period=${period}`);
  };

  return (
    <button type="button" onClick={handleClick} aria-busy={busy || undefined} className={className}>
      {cta}
    </button>
  );
}
