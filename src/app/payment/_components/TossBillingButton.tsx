"use client";

import { useRouter } from "next/navigation";

interface TossBillingButtonProps {
  plan: string;
  amount: number;
}

export default function TossBillingButton({ plan, amount }: TossBillingButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // /api/toss/billing/auth 로 이동 → 토스 빌링 카드 등록 위젯
    router.push(`/api/toss/billing/auth?plan=${plan}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full py-4 bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold rounded-xl transition text-base flex items-center justify-center gap-2"
    >
      {/* 토스 로고 모양 */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="white" fillOpacity="0.2"/>
        <path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      토스페이로 정기결제 &nbsp;₩{amount.toLocaleString()}
    </button>
  );
}
