'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // 1) jQuery 먼저 로드 → 완료 후 Payple SDK 로드
    const loadScript = (src: string, onLoad?: () => void) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      if (onLoad) script.onload = onLoad
      document.head.appendChild(script)
    }

    if (typeof (window as any).jQuery === 'undefined') {
      loadScript('https://code.jquery.com/jquery-3.7.1.min.js', () => {
        loadScript('https://cpay.payple.kr/js/cpay.payple.1.0.1.js')
      })
    } else {
      loadScript('https://cpay.payple.kr/js/cpay.payple.1.0.1.js')
    }
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    try {
      const authRes = await fetch('/api/payple/auth', { method: 'POST' })
      const authData = await authRes.json()

      if (!authData.access_token) {
        alert('인증 실패. 다시 시도해주세요.')
        return
      }

      const orderId = `${userId}_${plan}_${Date.now()}`
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

      const payplePay = {
        PCD_PAY_TYPE: 'card',
        PCD_PAY_WORK: 'AUTH',
        PCD_CARD_VER: '01',
        PCD_PAY_GOODS: `bibl lab ${planName} 구독`,
        PCD_PAY_TOTAL: amount,
        PCD_PAY_OID: orderId,
        PCD_PAYER_EMAIL: userEmail,
        PCD_PAYER_NAME: userName || '고객',
        PCD_RST_URL: `${appUrl}/api/payple/confirm`,
        PCD_AUTH_KEY: authData.access_token,
        PCD_CST_ID: authData.cst_id,
        callbackFunction: (res: any) => {
          if (res.PCD_PAY_RST === 'success') {
            router.push('/mypage?payment=success')
          } else {
            alert(`결제 실패: ${res.PCD_PAY_MSG}`)
          }
          setLoading(false)
        },
      }

      if (typeof (window as any).PaypleCpayAuthCheck !== 'undefined') {
        ;(window as any).PaypleCpayAuthCheck(payplePay)
      } else {
        alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.')
        setLoading(false)
      }
    } catch {
      alert('결제 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            처리 중...
          </>
        ) : (
          `페이플 카드 결제 ₩${amount.toLocaleString()}`
        )}
      </button>
      <p className="text-gray-600 text-xs text-center mt-2">
        카드 등록 후 매월 자동 결제됩니다. 언제든지 취소 가능합니다.
      </p>
    </div>
  )
}
