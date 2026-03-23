"use client";

import { useRouter } from "next/navigation";

interface Props {
  courseSlug: string;
  courseTitle: string;
  price: number;
  priceLabel: string;
  hasPurchased: boolean;
}

export default function CourseEnrollButton({ courseSlug, courseTitle, price, priceLabel, hasPurchased }: Props) {
  const router = useRouter();

  if (hasPurchased) {
    return (
      <button
        onClick={() => router.push(`/studio/classroom/${courseSlug}`)}
        className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition text-sm"
      >
        수강하기 →
      </button>
    );
  }

  // 가격문의 (price === 0)
  if (price === 0) {
    return (
      <a
        href="http://pf.kakao.com/_beBNn/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-semibold transition text-sm text-center"
      >
        카카오톡으로 문의하기
      </a>
    );
  }

  // 유료 강의 결제 (Toss 단건)
  const handlePurchase = () => {
    const params = new URLSearchParams({
      courseSlug,
      courseTitle,
      amount: String(price),
    });
    router.push(`/studio/payment?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePurchase}
        className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition text-sm"
      >
        {priceLabel}로 수강 신청
      </button>
      <p className="text-xs text-gray-600 text-center">30일 환불 보장</p>
    </div>
  );
}
