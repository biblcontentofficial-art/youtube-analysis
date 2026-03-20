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
    resultLimit: 50,          // 검색 결과 최대 50건
    canCollect: false,        // 영상 수집/CSV 내보내기
    canAlgorithm: false,      // 알고리즘 확률 확인
  },
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    searchLimit: 10,          // 10회/일
    resultLimit: 100,         // 검색 결과 최대 100건
    canCollect: false,        // 영상 수집/CSV 내보내기
    canAlgorithm: true,       // 알고리즘 확률 확인
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    searchLimit: 50,          // 50회/일
    resultLimit: 200,         // 검색 결과 최대 200건
    canCollect: true,         // 영상 수집/CSV 내보내기
    canAlgorithm: true,       // 알고리즘 확률 확인
  },
  business: {
    name: "Business",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    searchLimit: 9999,        // 무제한 (실질적 무제한)
    resultLimit: 200,         // 검색 결과 최대 200건
    canCollect: true,         // 영상 수집/CSV 내보내기
    canAlgorithm: true,       // 알고리즘 확률 확인
  },
} as const;

export type PlanKey = keyof typeof PLANS;
