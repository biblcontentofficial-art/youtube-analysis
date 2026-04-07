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

        {/* 메인 카드 (흰색 배경 - 토스 스타일) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* 주문 요약 헤더 */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-500">{PLANS[plan].name}</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{periodLabel}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-gray-900">
                  ₩{amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mt-1">{periodDesc}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* 에러 */}
          {errorMsg && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {errorMsg}
            </div>
          )}

          {/* 결제수단 */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">결제수단</p>
            <PaymentButtons
              plan={plan as PortonePlanKey}
              userId={userId}
              userEmail={userEmail}
              userName={userName}
              period={period}
            />
          </div>

          <div className="h-px bg-gray-100" />

          {/* 하단 안내 */}
          <div className="px-6 py-4 space-y-1">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              결제 시{' '}
              <Link href="/terms" className="underline hover:text-gray-600" target="_blank">이용약관</Link>
              {' '}및{' '}
              <Link href="/privacy" className="underline hover:text-gray-600" target="_blank">개인정보처리방침</Link>
              에 동의합니다.{' '}
              <Link href="/refund" className="underline hover:text-gray-600" target="_blank">환불정책</Link>
            </p>
          </div>

          {/* 보안 뱃지 */}
          <div className="px-6 pb-5 flex items-center justify-center gap-1.5 text-gray-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[11px]">SSL 보안 결제</span>
          </div>
        </div>

      </div>
    </div>
  )
}
