export const PAYPLE_CONFIG = {
  cstId: process.env.PAYPLE_CST_ID!,
  custKey: process.env.PAYPLE_CUST_KEY!,
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://cpay.payple.kr'
    : 'https://testcpay.payple.kr',
}

export const PLANS = {
  starter: {
    name: 'Starter',
    amount: 49000,           // 연간 월환산 (기본)
    monthlyAmount: 70000,    // 월간 결제 (30% 할증)
    yearlyAmount: 588000,    // 연간 일시불 (49000 × 12)
    searchLimit: 10,
  },
  pro: {
    name: 'Pro',
    amount: 99000,
    monthlyAmount: 140000,   // 월간 결제 (30% 할증)
    yearlyAmount: 1188000,   // 연간 일시불 (99000 × 12)
    searchLimit: 50,
  },
  business: {
    name: 'Business',
    amount: 490000,
    monthlyAmount: 700000,   // 월간 결제 (30% 할증)
    yearlyAmount: 5880000,   // 연간 일시불 (490000 × 12)
    searchLimit: -1, // unlimited
  },
}

export type BillingPeriod = 'monthly' | 'yearly';

/** period에 따라 실제 결제 금액 반환 */
export function getPlanAmount(plan: PlanKey, period: BillingPeriod): number {
  const p = PLANS[plan];
  return period === 'yearly' ? p.yearlyAmount : p.monthlyAmount;
}

export type PlanKey = keyof typeof PLANS

// Get Payple auth token
export async function getPaypleToken() {
  const res = await fetch(`${PAYPLE_CONFIG.baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'referer': process.env.NEXT_PUBLIC_APP_URL! },
    body: JSON.stringify({
      cst_id: PAYPLE_CONFIG.cstId,
      custKey: PAYPLE_CONFIG.custKey,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.PCD_PAY_MSG || 'Payple auth failed')
  return data // { access_token, token_type, PCD_PAY_RST, ... }
}

// Charge billing key (server-side monthly billing)
export async function chargeByBillingKey(params: {
  payerNo: string   // PCD_PAYER_NO (our internal user ID)
  payerId: string   // PCD_PAYER_ID from registration
  payerKey: string  // PCD_PAYER_KEY from registration
  amount: number
  orderId: string
  goodsName: string
}) {
  const token = await getPaypleToken()
  const res = await fetch(`${PAYPLE_CONFIG.baseUrl}/php/auth.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.access_token}`,
      'referer': process.env.NEXT_PUBLIC_APP_URL!,
    },
    body: JSON.stringify({
      PCD_CST_ID: PAYPLE_CONFIG.cstId,
      PCD_CUST_KEY: PAYPLE_CONFIG.custKey,
      PCD_AUTH_KEY: token.access_token,
      PCD_PAY_TYPE: 'card',
      PCD_PAY_WORK: 'PAY',
      PCD_CARD_VER: '01',
      PCD_PAYER_NO: params.payerNo,
      PCD_PAYER_ID: params.payerId,
      PCD_PAYER_KEY: params.payerKey,
      PCD_PAY_GOODS: params.goodsName,
      PCD_PAY_TOTAL: params.amount,
      PCD_PAY_OID: params.orderId,
    }),
  })
  return res.json()
}
