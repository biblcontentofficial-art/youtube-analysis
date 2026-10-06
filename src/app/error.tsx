"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  // 404·점검 화면과 같은 틀: 큰 장식 글자 + 제목 + 설명 + 흰 버튼 하나와 보조 버튼
  return (
    <main className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container size="reading" className="text-center">
        <div aria-hidden="true" className="text-display font-black text-neutral-700">
          ERROR
        </div>
        <h1 className="mt-4 text-h4 text-white">오류가 발생했습니다</h1>
        <p className="mt-3 text-body-sm text-neutral-400 md:text-body">
          일시적인 오류입니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className={buttonClass()}>
            다시 시도
          </button>
          {/* 오류에서 벗어날 때는 전체 새로고침이 맞아 next/link 대신 <a> 를 쓴다 */}
          <a href="/" className={buttonClass({ variant: "secondary" })}>
            홈으로
          </a>
        </div>
      </Container>
    </main>
  );
}
