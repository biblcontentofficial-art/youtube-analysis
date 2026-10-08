import type { Metadata } from 'next'
import { auth, currentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PLANS, PlanKey, getPlanAmount, type BillingPeriod } from '@/lib/payple'
import PaymentButtons from './_components/PaymentButtons'
import { WarningIcon } from '@/components/ui/icons'
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

  const userName = user?.firstName ?? ''
  const userEmail = user?.email || ''

  const periodLabel = period === 'yearly' ? '연간 구독' : '월간 구독'
  const periodDesc = period === 'yearly' ? '연 1회 결제' : '매월 자동 결제'

  return (
    <main className="flex min-h-[calc(100dvh-var(--nav-h))] flex-col items-center bg-canvas px-6 py-8 sm:justify-center sm:py-16">
      <div className="w-full max-w-[420px]">

        {/* 뒤로가기 */}
        <Link
          href="/pricing"
          className="mb-4 inline-flex h-11 items-center gap-1.5 text-body-sm text-fg-3 transition-colors hover:text-fg"
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          요금제로 돌아가기
        </Link>

        {/* 주문 요약 */}
        <div className="mb-4 rounded-card border border-line bg-surface p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-caption font-semibold text-fg-2">{PLANS[plan].name}</span>
            <span className="inline-flex shrink-0 items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">{periodLabel}</span>
          </div>
          <p className="tnum mb-1 text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-fg">
            ₩{amount.toLocaleString()}
          </p>
          <p className="text-body-sm text-fg-3">{periodDesc}</p>
          {period === 'yearly' && (
            <p className="tnum mt-0.5 text-body-sm text-fg-3">
              월 ₩{Math.round(amount / 12).toLocaleString()} 꼴 · 12개월
            </p>
          )}
        </div>

        {/* 에러 */}
        {errorMsg && (
          <div role="alert" className="mb-4 flex items-center gap-2.5 rounded-card border border-negative/55 px-4 py-3 text-body-sm text-fg-1">
            <WarningIcon size={16} className="text-negative" />
            {errorMsg}
          </div>
        )}

        {/* 결제수단 */}
        <div className="mb-4 rounded-card border border-line bg-surface p-5 sm:p-6">
          <h1 className="mb-4 text-caption font-semibold text-fg-3">결제수단</h1>
          <PaymentButtons
            plan={plan as PortonePlanKey}
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            period={period}
          />
        </div>

        {/* 안내 문구 */}
        <div className="space-y-2 px-2 text-center">
          <p className="text-caption text-fg-3">
            ※ 정기 구독은 결제 후 유료 서비스를 사용하지 않은 경우 7일 내 취소할 수 있습니다.
          </p>
          <p className="text-caption text-fg-3">
            ※ 구독 기간 마지막 날 다음 자동 결제가 이뤄집니다. 결제 후 구독 기간은 자동 갱신됩니다.
          </p>
        </div>

        {/* 하단 링크 */}
        <div className="mt-4 text-center">
          <p className="text-micro text-fg-3">
            결제 시{' '}
            <Link href="/terms" className="text-fg-2 underline underline-offset-2 hover:text-fg" target="_blank">이용약관</Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-fg-2 underline underline-offset-2 hover:text-fg" target="_blank">개인정보처리방침</Link>
            에 동의합니다.{' '}
            <Link href="/refund" className="text-fg-2 underline underline-offset-2 hover:text-fg" target="_blank">환불정책</Link>
          </p>
        </div>

        {/* 보안 뱃지 */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-fg-3">
          <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-micro">SSL 보안 결제</span>
        </div>

      </div>
    </main>
  )
}
