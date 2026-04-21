// 토스페이먼츠 연동 설정
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

export const TOSS_PLANS = {
  starter: {
    amount: 15000,
    monthlyAmount: 19000,
    yearlyAmount: 180000,
    orderName: "bibl lab Starter 플랜",
  },
  pro: {
    amount: 39000,
    monthlyAmount: 45000,
    yearlyAmount: 468000,
    orderName: "bibl lab Pro 플랜",
  },
  business: {
    amount: 310000,
    monthlyAmount: 390000,
    yearlyAmount: 3720000,
    orderName: "bibl lab Team bibl 플랜",
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
