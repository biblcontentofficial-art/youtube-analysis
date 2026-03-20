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
    searchLimit: 2,
    resultLimit: 50,
    canCollect: false,
    canAlgorithm: false,
    canChannelReport: false,
    canChannelSearch: false,  // 채널 찾기
    canTrending: false,       // 트렌드 분석
    canSavedVideos: false,    // 수집한 영상
    canServerHistory: false,  // 서버 검색 기록 저장
    historyDays: 0,           // 0 = localStorage만
  },
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    searchLimit: 10,
    resultLimit: 100,
    canCollect: false,
    canAlgorithm: true,
    canChannelReport: false,
    canChannelSearch: true,
    canTrending: true,
    canSavedVideos: false,
    canServerHistory: true,
    historyDays: 30,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    searchLimit: 50,
    resultLimit: 200,
    canCollect: true,
    canAlgorithm: true,
    canChannelReport: true,
    canChannelSearch: true,
    canTrending: true,
    canSavedVideos: true,
    canServerHistory: true,
    historyDays: 9999,        // 무제한
  },
  business: {
    name: "Business",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    searchLimit: 9999,
    resultLimit: 200,
    canCollect: true,
    canAlgorithm: true,
    canChannelReport: true,
    canChannelSearch: true,
    canTrending: true,
    canSavedVideos: true,
    canServerHistory: true,
    historyDays: 9999,
  },
  // 관리자 전용 플랜 — 결제 없음, pricing 페이지 미노출, 매출 집계 제외
  admin: {
    name: "Admin",
    priceId: null,
    searchLimit: 999,
    resultLimit: 9999,
    canCollect: true,
    canAlgorithm: true,
    canChannelReport: true,
    canChannelSearch: true,
    canTrending: true,
    canSavedVideos: true,
    canServerHistory: true,
    historyDays: 9999,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
