import Stripe from "stripe";

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export type PlanConfig = {
  name: string;
  priceId: string | null | undefined;
  dailySearchLimit: number | null;           // null = 일 한도 없음
  monthlySearchLimit: number | null;         // null = 무제한
  dailyChannelSearchLimit: number | null;    // null = 일 한도 없음 (채널 검색 일별 한도)
  channelSearchMonthlyLimit: number | null;  // null = 무제한 (채널 검색 월별 한도)
  resultLimit: number;                       // 세션당 최대 결과 수 (더보기 포함)
  canLoadMore: boolean;
  maxTeamSize: number;
  canCollect: boolean;
  canAlgorithm: boolean;
  canChannelReport: boolean;
  canChannelSearch: boolean;
  canSavedVideos: boolean;
  canServerHistory: boolean;
  historyDays: number;
};

export type PlanKey = "free" | "starter" | "pro" | "business" | "admin";

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    name: "Free",
    priceId: null,
    dailySearchLimit: 2,
    monthlySearchLimit: null,
    dailyChannelSearchLimit: 1,
    channelSearchMonthlyLimit: null,
    resultLimit: 30,
    canLoadMore: true,
    maxTeamSize: 1,
    canCollect: false,
    canAlgorithm: false,
    canChannelReport: false,
    canChannelSearch: true,
    canSavedVideos: false,
    canServerHistory: false,
    historyDays: 0,
  },
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    dailySearchLimit: null,
    monthlySearchLimit: 50,
    dailyChannelSearchLimit: null,
    channelSearchMonthlyLimit: 30,
    resultLimit: 100,
    canLoadMore: true,
    maxTeamSize: 1,
    canCollect: false,
    canAlgorithm: true,
    canChannelReport: false,
    canChannelSearch: true,
    canSavedVideos: false,
    canServerHistory: true,
    historyDays: 30,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    dailySearchLimit: null,
    monthlySearchLimit: 500,
    dailyChannelSearchLimit: null,
    channelSearchMonthlyLimit: 500,
    resultLimit: 500,
    canLoadMore: true,
    maxTeamSize: 2,
    canCollect: true,
    canAlgorithm: true,
    canChannelReport: true,
    canChannelSearch: true,
    canSavedVideos: true,
    canServerHistory: true,
    historyDays: 9999,
  },
  business: {
    name: "Business",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    dailySearchLimit: null,
    monthlySearchLimit: null,
    dailyChannelSearchLimit: null,
    channelSearchMonthlyLimit: null,
    resultLimit: 1000,
    canLoadMore: true,
    maxTeamSize: 5,
    canCollect: true,
    canAlgorithm: true,
    canChannelReport: true,
    canChannelSearch: true,
    canSavedVideos: true,
    canServerHistory: true,
    historyDays: 9999,
  },
  // 관리자 전용 플랜 — 결제 없음, pricing 페이지 미노출, 매출 집계 제외
  admin: {
    name: "Admin",
    priceId: null,
    dailySearchLimit: null,
    monthlySearchLimit: null,
    dailyChannelSearchLimit: null,
    channelSearchMonthlyLimit: null,
    resultLimit: 9999,
    canLoadMore: true,
    maxTeamSize: 999,
    canCollect: true,
    canAlgorithm: true,
    canChannelReport: true,
    canChannelSearch: true,
    canSavedVideos: true,
    canServerHistory: true,
    historyDays: 9999,
  },
};
