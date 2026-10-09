"use client";

/**
 * /search 오류 화면. DESIGN 6.18 상태 화면 틀(not-found·error 와 같은 구조).
 * 원인 기호는 negative 맨 SVG 하나 + 문장. 흰 면 버튼은 '다시 시도' 하나, '검색 초기화'는 보조.
 */
import { useEffect } from "react";
import { buttonClass } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SearchError]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center bg-canvas py-16 text-fg md:py-24">
      <div className="mx-auto w-full max-w-reading px-6 text-center break-keep lg:px-8">
        <WarningIcon size={24} className="mx-auto size-10 text-negative" />
        <h1 className="mt-4 text-h4 text-fg">검색 중 오류가 발생했습니다</h1>
        <p className="mt-3 text-body-sm text-fg-3 md:text-body">잠시 후 다시 시도해주세요.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className={buttonClass()}>
            다시 시도
          </button>
          <a href="/search" className={buttonClass({ variant: "secondary" })}>
            검색 초기화
          </a>
        </div>
      </div>
    </main>
  );
}
