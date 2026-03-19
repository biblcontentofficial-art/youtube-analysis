"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type PricingButtonProps = {
  plan: string; // 'free' | 'starter' | 'pro' | 'business'
  cta: string;
  ctaStyle: string;
};

export default function PricingButton({ plan, cta, ctaStyle }: PricingButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleClick = () => {
    if (!isLoaded) return;

    if (plan === "free") {
      router.push("/sign-up");
      return;
    }

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/pricing");
      return;
    }

    router.push(`/payment?plan=${plan}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isLoaded}
      className={`w-full py-2.5 rounded-xl font-semibold text-center text-sm transition-all ${ctaStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {cta}
    </button>
  );
}
