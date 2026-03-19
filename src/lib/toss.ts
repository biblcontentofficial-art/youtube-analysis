// 토스페이먼츠 연동 설정
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

export const TOSS_PLANS = {
  starter: {
    amount: 49000,
    orderName: "bibl lab Starter 플랜",
  },
  pro: {
    amount: 199000,
    orderName: "bibl lab Pro 플랜",
  },
  business: {
    amount: 490000,
    orderName: "bibl lab Business 플랜",
  },
} as const;

export type TossPlanKey = keyof typeof TOSS_PLANS;
