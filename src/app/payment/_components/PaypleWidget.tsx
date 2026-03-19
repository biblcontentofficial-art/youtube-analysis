'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface PaypleWidgetProps {
  plan: string
  userId: string
  userEmail: string
  userName: string
  amount: number
  planName: string
}

export default function PaypleWidget({
  plan, userId, userEmail, userName, amount, planName
}: PaypleWidgetProps) {
  const router = useRouter()
  const initialized = useRef(false)

  const handlePayment = async () => {
    // Get auth token from our API
    const authRes = await fetch('/api/payple/auth', { method: 'POST' })
    const authData = await authRes.json()

    if (!authData.access_token) {
      alert('인증 실패. 다시 시도해주세요.')
      return
    }

    const orderId = `${userId}_${plan}_${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    // Payple payment object
    const payplePay = {
      PCD_PAY_TYPE: 'card',
      PCD_PAY_WORK: 'AUTH',        // AUTH = 카드 등록 + 최초 결제
      PCD_CARD_VER: '01',
      PCD_PAY_GOODS: `bibl lab ${planName} 구독`,
      PCD_PAY_TOTAL: amount,
      PCD_PAY_OID: orderId,
      PCD_PAYER_EMAIL: userEmail,
      PCD_PAYER_NAME: userName || '고객',
      PCD_RST_URL: `${appUrl}/api/payple/confirm`, // 절대 URL (Payple 콜백)
      PCD_AUTH_KEY: authData.access_token,
      PCD_CST_ID: authData.cst_id,
      callbackFunction: (res: any) => {
        if (res.PCD_PAY_RST === 'success') {
          router.push('/mypage?payment=success')
        } else {
          alert(`결제 실패: ${res.PCD_PAY_MSG}`)
        }
      },
    }

    // Call Payple SDK
    if (typeof window !== 'undefined' && (window as any).PaypleCpayAuthCheck) {
      ;(window as any).PaypleCpayAuthCheck(payplePay)
    }
  }

  useEffect(() => {
    // Load Payple SDK script
    if (!initialized.current) {
      initialized.current = true
      const script = document.createElement('script')
      script.src = 'https://cpay.payple.kr/js/cpay.payple.1.0.1.js'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div>
      <button
        onClick={handlePayment}
        className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition text-lg"
      >
        ₩{amount.toLocaleString()} 결제하기
      </button>
      <p className="text-gray-500 text-xs text-center mt-3">
        카드 등록 후 매월 자동 결제됩니다. 언제든지 취소 가능합니다.
      </p>
    </div>
  )
}
