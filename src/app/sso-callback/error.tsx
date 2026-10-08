"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { WarningIcon } from "@/components/ui/icons";

export default function SSOCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SSO Callback Error]", error.message);
    // 3초 후 로그인 페이지로 자동 이동
    const timer = setTimeout(() => {
      window.location.href = "/sign-in";
    }, 3000);
    return () => clearTimeout(timer);
  }, [error]);

  // 상태 화면 틀(DESIGN 6.18): 원인 기호(negative 맨 SVG) + 제목 + 설명 + 흰 버튼 하나와 보조 버튼
  return (
    <main className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container size="reading" className="text-center">
        <WarningIcon size={24} className="mx-auto size-10 text-negative" />
        <h1 className="mt-4 text-h4 text-fg">로그인 처리 중 문제가 발생했습니다</h1>
        <p className="mt-3 text-body-sm text-fg-3 md:text-body">잠시 후 로그인 페이지로 이동합니다.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className={buttonClass()}>
            다시 시도
          </button>
          <button
            type="button"
            onClick={() => window.location.href = "/sign-in"}
            className={buttonClass({ variant: "secondary" })}
          >
            로그인 페이지로
          </button>
        </div>
      </Container>
    </main>
  );
}
