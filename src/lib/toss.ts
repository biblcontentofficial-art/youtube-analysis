// 토스페이먼츠 연동 설정
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

export const TOSS_PLANS = {
  starter: {
    amount: 49000,           // 연간 월환산 (레거시 호환)
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

export type TossPlanKey = keyof typeof TOSS_PLANS;
export type BillingPeriod = "monthly" | "yearly";

/** period에 따라 실제 결제 금액 반환 */
export function getTossPlanAmount(plan: TossPlanKey, period: BillingPeriod): number {
  const p = TOSS_PLANS[plan];
  return period === "yearly" ? p.yearlyAmount : p.monthlyAmount;
}

/** period에 따라 주문명 반환 */
export function getTossOrderName(plan: TossPlanKey, period: BillingPeriod): string {
  const suffix = period === "yearly" ? " (연간)" : " (월간)";
  return TOSS_PLANS[plan].orderName + suffix;
}
