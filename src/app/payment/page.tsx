import type { Metadata } from 'next'
import { auth, currentUser } from '@clerk/nextjs/server'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { redirect } from 'next/navigation'
import { PLANS, PlanKey } from '@/lib/payple'
import TossBillingButton from './_components/TossBillingButton'
import PortoneButton from './_components/PortoneButton'

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { plan?: string; error?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/pricing')

  const plan = searchParams.plan as PlanKey
  if (!plan || !PLANS[plan]) redirect('/pricing')

  const user = await currentUser()
  const errorMsg =
    searchParams.error === 'billing'  ? '카드 등록에 실패했습니다. 다시 시도해 주세요.' :
    searchParams.error === 'payment'  ? '결제에 실패했습니다. 다시 시도해 주세요.' :
    searchParams.error === 'portone'  ? '결제에 실패했습니다. 다시 시도해 주세요.' :
    null

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">

          <h1 className="text-2xl font-bold text-white mb-1">결제하기</h1>
          <p className="text-gray-400 text-sm mb-6">{PLANS[plan].name} 플랜 — 월 정기 구독</p>

          {/* 결제 금액 */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-300 font-medium">{PLANS[plan].name}</p>
                <p className="text-gray-500 text-xs mt-0.5">매월 자동 결제 · 언제든 취소 가능</p>
              </div>
              <span className="text-white font-bold text-lg">
                ₩{PLANS[plan].amount.toLocaleString()}
                <span className="text-gray-500 text-sm font-normal">/월</span>
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* 결제수단 */}
          <div className="space-y-2">
            <TossBillingButton plan={plan} amount={PLANS[plan].amount} userId={userId} />
            <PortoneButton
              plan={plan}
              userId={userId}
              userEmail={user?.emailAddresses[0]?.emailAddress || ''}
            />
          </div>

          {/* 안내 */}
          <div className="mt-6 space-y-1 text-xs text-gray-600 text-center">
            <p>카드 등록 후 매월 자동 결제됩니다. 언제든지 취소 가능합니다.</p>
            <p>
              결제 전{' '}
              <a href="/refund" className="text-gray-500 underline hover:text-gray-400" target="_blank">
                환불정책
              </a>
              을 확인하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
