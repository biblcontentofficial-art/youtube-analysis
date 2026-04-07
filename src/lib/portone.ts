export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "";

// PG별 채널키 (포트원 콘솔 > 결제연동에서 각 PG별로 발급)
export const PORTONE_KAKAOPAY_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY || "";
export const PORTONE_NAVERPAY_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY || "";
export const PORTONE_KCP_CHANNEL_KEY      = process.env.NEXT_PUBLIC_PORTONE_KCP_CHANNEL_KEY || "";
export const PORTONE_INICIS_CHANNEL_KEY   = process.env.NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY || "";

export const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";

// billing_key prefix: 포트원 빌링키를 Toss와 구분하기 위해 저장 시 접두사 추가
// DB 스키마 변경 없이 Toss / PortOne을 구분
export const PORTONE_BILLING_KEY_PREFIX = "portone:";

export const PORTONE_PLANS = {
  starter: {
    amount: 49000,
    monthlyAmount: 59000,
    yearlyAmount: 588000,
    orderName: "bibl lab Starter 플랜",
  },
  pro: {
    amount: 199000,
    monthlyAmount: 249000,
    yearlyAmount: 2388000,
    orderName: "bibl lab Pro 플랜",
  },
  business: {
    amount: 490000,
    monthlyAmount: 590000,
    yearlyAmount: 5880000,
    orderName: "bibl lab Business 플랜",
  },
} as const;

export type PortonePlanKey = keyof typeof PORTONE_PLANS;
