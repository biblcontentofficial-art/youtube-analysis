import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { PLANS, PlanKey } from '@/lib/payple'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      PCD_PAY_RST,    // 'success' or 'fail'
      PCD_PAY_MSG,    // message
      PCD_PAYER_ID,   // billing key part 1
      PCD_PAYER_KEY,  // billing key part 2
      PCD_PAY_OID,    // order ID (contains userId and plan)
      PCD_PAY_TOTAL,  // amount paid
      PCD_PAY_TIME,   // payment time
    } = body

    if (PCD_PAY_RST !== 'success') {
      return NextResponse.json({ error: PCD_PAY_MSG }, { status: 400 })
    }

    // Parse orderId: format is "userId_plan_timestamp"
    // Clerk userId can contain underscores (e.g. "user_abc123"), so we parse
    // from the end: last part = timestamp, second-to-last = plan, rest = userId
    const parts = (PCD_PAY_OID as string).split('_')
    const plan = parts[parts.length - 2]
    const userId = parts.slice(0, parts.length - 2).join('_')

    if (!userId || !plan || !PLANS[plan as PlanKey]) {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
    }

    // Update Clerk user metadata with plan + billing key
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        plan: plan,
        payplePayerId: PCD_PAYER_ID,
        payplePayerKey: PCD_PAYER_KEY,
        subscriptionStarted: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true, plan })
  } catch (e: any) {
    console.error('Payple confirm error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Handle redirect callback
  const searchParams = req.nextUrl.searchParams
  const rst = searchParams.get('PCD_PAY_RST')

  if (rst === 'success') {
    return NextResponse.redirect(new URL('/mypage?payment=success', req.url))
  }
  return NextResponse.redirect(new URL('/pricing?payment=failed', req.url))
}
