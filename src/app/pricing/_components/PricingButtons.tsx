"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type PricingButtonProps = {
  plan: string; // 'free' | 'starter' | 'pro' | 'business'
  cta: string;
  ctaStyle: string;
  period?: "monthly" | "yearly";
};

export default function PricingButton({ plan, cta, ctaStyle, period = "yearly" }: PricingButtonProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsSignedIn(!!data.user);
      setIsLoaded(true);
    };
    fetchUser();
  }, []);

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

    router.push(`/payment?plan=${plan}&period=${period}`);
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
