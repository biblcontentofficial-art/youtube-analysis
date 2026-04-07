import type { Metadata } from 'next'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PLANS, PlanKey, getPlanAmount, type BillingPeriod } from '@/lib/payple'
import PaymentButtons from './_components/PaymentButtons'
import type { PortonePlanKey } from '@/lib/portone'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const PLAN_BADGE_COLOR: Record<string, string> = {
  starter: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  pro:     'bg-purple-500/20 text-purple-300 border-purple-500/30',
  business:'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { plan?: string; period?: string; error?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/pricing')

  const plan = searchParams.plan as PlanKey
  if (!plan || !PLANS[plan]) redirect('/pricing')

  const period: BillingPeriod = searchParams.period === 'monthly' ? 'monthly' : 'yearly';
  const amount = getPlanAmount(plan, period);

  const user = await currentUser()
  const errorMsg =
    searchParams.error === 'billing' ? '카드 등록에 실패했습니다. 다시 시도해 주세요.' :
    searchParams.error === 'payment' ? '결제에 실패했습니다. 다시 시도해 주세요.' :
    searchParams.error === 'portone' ? '결제에 실패했습니다. 다시 시도해 주세요.' :
    null

  const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
  const userEmail = user?.emailAddresses[0]?.emailAddress || ''

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* 뒤로가기 */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          요금제로 돌아가기
        </Link>

        {/* 주문 요약 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PLAN_BADGE_COLOR[plan] ?? 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  {PLANS[plan].name}
                </span>
              </div>
              <p className="text-white font-semibold text-base">
                {period === 'yearly' ? '연간 구독' : '월간 구독'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {period === 'yearly' ? '연 1회 일시불 결제 · 언제든 취소 가능' : '매월 자동 결제 · 언제든 취소 가능'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white font-bold text-xl">
                ₩{amount.toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs">{period === 'yearly' ? '/년' : '/월'}</p>
            </div>
          </div>
        </div>

        {/* 에러 */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/60 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* 결제수단 선택 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">결제수단 선택</p>
          <PaymentButtons
            plan={plan as PortonePlanKey}
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            period={period}
          />
        </div>

        {/* 안내 */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-xs text-gray-600">
            {period === 'yearly' ? '연간 구독료가 일시불로 결제됩니다.' : '카드 등록 후 매월 자동 결제됩니다.'} 언제든지 취소 가능합니다.
          </p>
          <p className="text-xs text-gray-600">
            결제 시{' '}
            <Link href="/terms" className="text-gray-500 underline hover:text-gray-400" target="_blank">
              이용약관
            </Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-gray-500 underline hover:text-gray-400" target="_blank">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
          <p className="text-xs text-gray-600">
            결제 전{' '}
            <Link href="/refund" className="text-gray-500 underline hover:text-gray-400" target="_blank">
              환불정책
            </Link>
            을 확인하세요.
          </p>
        </div>

        {/* 보안 뱃지 */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-700">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs">SSL 보안 결제</span>
        </div>

      </div>
    </div>
  )
}
