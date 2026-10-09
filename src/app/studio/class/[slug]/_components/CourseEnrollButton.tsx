"use client";

import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";

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
        className={buttonClass({ block: true })}
      >
        수강하기 →
      </button>
    );
  }

  // 가격문의 (price === 0)
  if (price === 0) {
    return (
      <a
        href="https://pf.kakao.com/_beBNn/chat"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass({ variant: "kakao", block: true })}
      >
        카카오톡으로 문의하기
        <span className="sr-only">(새 창)</span>
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
        className={buttonClass({ block: true })}
      >
        {priceLabel}으로 수강 신청
      </button>
      <p className="text-center text-caption text-fg-3">30일 환불 보장</p>
    </div>
  );
}
