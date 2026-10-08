"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CloseIcon } from "@/components/ui/icons";

function TossPaymentFailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const code = searchParams.get("code");

  // 상태 화면 틀(DESIGN 6.18): 원인 기호(negative 맨 SVG) + 제목 + 설명 + 흰 버튼 하나와 보조 버튼
  return (
    <main className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container size="reading" className="text-center">
        <CloseIcon size={24} className="mx-auto size-10 text-negative" />
        <h1 className="mt-4 text-h4 text-fg">결제에 실패했습니다</h1>
        {message && (
          <p className="mt-3 text-body-sm text-fg-3 md:text-body">{message}</p>
        )}
        {code && (
          <p className="mt-2 text-caption text-fg-3">오류 코드: {code}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/pricing" className={buttonClass()}>
            요금제 페이지로 돌아가기
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className={buttonClass({ variant: "secondary" })}
          >
            다시 시도하기
          </button>
        </div>
      </Container>
    </main>
  );
}

export default function TossPaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <TossPaymentFailContent />
    </Suspense>
  );
}
