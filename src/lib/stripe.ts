import Stripe from "stripe";

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    searchLimit: 2,           // 2회/일
  },
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    searchLimit: 10,          // 10회/일
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    searchLimit: 50,          // 50회/일
  },
  business: {
    name: "Business",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    searchLimit: 9999,        // 무제한 (실질적 무제한)
  },
} as const;

export type PlanKey = keyof typeof PLANS;
