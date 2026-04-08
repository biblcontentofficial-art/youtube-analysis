import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { PLANS, PlanKey } from '@/lib/payple'

// Clerk userId 형식 검증 (user_xxxxxxxxxxxxxxxxxxxxxxxx)
const CLERK_USER_ID_RE = /^user_[A-Za-z0-9]{20,}$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      PCD_PAY_RST,
      PCD_PAY_MSG,
      PCD_PAYER_ID,
      PCD_PAYER_KEY,
      PCD_PAY_OID,
      PCD_PAY_TOTAL,
    } = body

    // ── 1. 결제 성공 여부 확인 ────────────────────────────────────────
    if (PCD_PAY_RST !== 'success') {
      return NextResponse.json({ error: PCD_PAY_MSG }, { status: 400 })
    }

    // ── 2. orderId 파싱 + 형식 검증 ──────────────────────────────────
    const orderId = String(PCD_PAY_OID ?? '')
    const parts = orderId.split('_')
    // 형식: userId(user_xxxxx)_plan_timestamp → parts >= 3 필요
    if (parts.length < 3) {
      console.error('[Payple] Invalid orderId format:', orderId)
      return NextResponse.json({ error: 'Invalid order format' }, { status: 400 })
    }

    const plan = parts[parts.length - 2] as PlanKey
    const userId = parts.slice(0, parts.length - 2).join('_')

    // ── 3. 플랜 유효성 검증 ───────────────────────────────────────────
    if (!PLANS[plan]) {
      console.error('[Payple] Unknown plan:', plan)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // ── 4. userId 형식 검증 ───────────────────────────────────────────
    if (!CLERK_USER_ID_RE.test(userId)) {
      console.error('[Payple] Invalid userId format:', userId)
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    // ── 5. 결제 금액 검증 (플랜 실제 금액과 반드시 일치해야 함) ────────
    const paidAmount = Number(PCD_PAY_TOTAL)
    const validAmounts = [
      PLANS[plan].monthlyAmount,
      PLANS[plan].yearlyAmount,
    ]
    if (!validAmounts.includes(paidAmount)) {
      console.error('[Payple] Amount mismatch:', { paidAmount, validAmounts, plan })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // ── 6. Clerk 사용자 존재 여부 확인 ────────────────────────────────
    const client = await clerkClient()
    try {
      await client.users.getUser(userId)
    } catch {
      console.error('[Payple] User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // ── 7. 메타데이터 업데이트 ────────────────────────────────────────
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        plan,
        payplePayerId: PCD_PAYER_ID,
        payplePayerKey: PCD_PAYER_KEY,
        subscriptionStarted: new Date().toISOString(),
      },
    })

    console.log('[Payple] Payment confirmed:', { userId, plan, amount: paidAmount })
    return NextResponse.json({ success: true, plan })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Payple] confirm error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const rst = req.nextUrl.searchParams.get('PCD_PAY_RST')
  if (rst === 'success') {
    return NextResponse.redirect(new URL('/mypage?payment=success', req.url))
  }
  return NextResponse.redirect(new URL('/pricing?payment=failed', req.url))
}
