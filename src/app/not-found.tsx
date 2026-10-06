import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

// 템플릿이 " | 비블랩 (bibl lab)" 을 붙인다
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
};

// 오류·점검 화면과 같은 틀: 큰 장식 글자 + 제목 + 설명 + 흰 버튼 하나와 보조 버튼
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container size="reading" className="text-center">
        <div aria-hidden="true" className="text-display font-black text-neutral-700">
          404
        </div>
        <h1 className="mt-4 text-h4 text-white">페이지를 찾을 수 없어요</h1>
        <p className="mt-3 text-body-sm text-neutral-400 md:text-body">
          요청하신 페이지가 존재하지 않거나 이동됐습니다.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClass()}>
            홈으로
          </Link>
          <Link href="/trend-search" className={buttonClass({ variant: "secondary" })}>
            유튜브 트렌드 서치
          </Link>
        </div>
      </Container>
    </main>
  );
}
