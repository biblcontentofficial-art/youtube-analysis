import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PLANS, PlanKey } from '@/lib/payple'
import PaypleWidget from './_components/PaypleWidget'

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/pricing')

  const plan = searchParams.plan as PlanKey
  if (!plan || !PLANS[plan]) redirect('/pricing')

  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">결제하기</h1>
          <p className="text-gray-400 mb-6">{PLANS[plan].name} 플랜 구독</p>

          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{PLANS[plan].name}</span>
              <span className="text-white font-bold">₩{PLANS[plan].amount.toLocaleString()}/월</span>
            </div>
          </div>

          <PaypleWidget
            plan={plan}
            userId={userId}
            userEmail={user?.emailAddresses[0]?.emailAddress || ''}
            userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            amount={PLANS[plan].amount}
            planName={PLANS[plan].name}
          />
        </div>
      </div>
    </div>
  )
}
