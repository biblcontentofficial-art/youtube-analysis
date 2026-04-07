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

  const periodLabel = period === 'yearly' ? '연간 구독' : '월간 구독'
  const periodDesc = period === 'yearly' ? '연 1회 결제' : '매월 자동 결제'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

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
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-400">{PLANS[plan].name}</span>
            <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">{periodLabel}</span>
          </div>
          <p className="text-3xl font-extrabold text-white mb-1">
            ₩{amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">{periodDesc}</p>
        </div>

        {/* 에러 */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/60 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* 결제수단 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">결제수단</p>
          <PaymentButtons
            plan={plan as PortonePlanKey}
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            period={period}
          />
        </div>

        {/* 안내 문구 */}
        <div className="space-y-2 text-center px-2">
          <p className="text-xs text-gray-600">
            ※ 정기 구독은 결제 후 유료 서비스를 사용하지 않은 경우 7일 내 취소할 수 있습니다.
          </p>
          <p className="text-xs text-gray-600">
            ※ 구독 기간 마지막 날 다음 자동 결제가 이뤄집니다. 결제 후 구독 기간은 자동 갱신됩니다.
          </p>
        </div>

        {/* 하단 링크 */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-gray-600">
            결제 시{' '}
            <Link href="/terms" className="text-gray-500 underline hover:text-gray-400" target="_blank">이용약관</Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-gray-500 underline hover:text-gray-400" target="_blank">개인정보처리방침</Link>
            에 동의합니다.{' '}
            <Link href="/refund" className="text-gray-500 underline hover:text-gray-400" target="_blank">환불정책</Link>
          </p>
        </div>

        {/* 보안 뱃지 */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-700">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-[11px]">SSL 보안 결제</span>
        </div>

      </div>
    </div>
  )
}
