export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "";
export const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "";
export const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";

export const PORTONE_PLANS = {
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

export type PortonePlanKey = keyof typeof PORTONE_PLANS;
