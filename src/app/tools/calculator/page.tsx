import type { Metadata } from "next";
import CalculatorClient from "./_components/CalculatorClient";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { WarningIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "유튜브 비율 계산기 (사용자 자가 도구)",
  description:
    "유튜브 영상 URL을 입력하면 클라이언트에서 비율을 직접 계산합니다. bibl lab이 제공하는 메트릭이 아닌, 사용자가 직접 실행하는 도구입니다.",
  alternates: { canonical: "https://bibllab.com/tools/calculator" },
  robots: { index: true, follow: true },
};

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <Container size="reading" className="py-12 md:py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <SectionHeader caption="bibl lab" label="TOOLS" className="md:mb-10" />
          <h1 className="mb-3 text-h3 text-fg md:text-h2">
            유튜브 비율 계산기
          </h1>
          <p className="text-body-sm text-fg-2 md:text-ui">
            영상 URL을 입력하고 원하는 계산 버튼을 누르세요. 모든 계산은
            <strong className="font-semibold text-fg"> 사용자가 직접 실행</strong>하며,
            결과는 <strong className="font-semibold text-fg">사용자의 브라우저에서 단순 산술로 계산</strong>한 값입니다.
          </p>
        </div>

        {/* 명확한 디스클레이머 박스: 주의 상태 메시지(DESIGN 6.13), 기호와 제목만 caution */}
        <div className="mb-8 flex gap-3 rounded-card border border-line bg-surface p-4">
          <WarningIcon className="mt-0.5 text-caution" />
          <div className="min-w-0">
            <h2 className="mb-2 text-ui font-semibold text-caution">사용 안내</h2>
            <ul className="list-outside list-disc space-y-1 pl-5 text-body-sm text-fg-3">
              <li>이 도구는 사용자가 명시적으로 버튼을 클릭할 때만 동작합니다.</li>
              <li>계산 결과는 YouTube가 제공하는 공식 메트릭이 아닙니다.</li>
              <li>bibl lab은 어떠한 평가/등급/예측 점수도 제공하지 않습니다. 단지 사용자가 자가 계산하는 도구만 제공합니다.</li>
              <li>YouTube API가 반환한 raw 데이터는 사용자의 브라우저에서 단순 산술(나눗셈, 곱셈)로 처리됩니다.</li>
            </ul>
          </div>
        </div>

        {/* 계산기 본체 */}
        <CalculatorClient />

        {/* 하단 안내 */}
        <div className="mt-12 rounded-card border border-line bg-surface p-5">
          <h3 className="mb-2 text-ui font-semibold text-fg">활용 팁</h3>
          <ul className="list-outside list-disc space-y-1.5 pl-5 text-body-sm text-fg-3">
            <li>계산 결과는 영상 기획·벤치마킹용 참고 값입니다.</li>
            <li>채널마다 평균값의 의미가 다르므로 절대적인 기준이 아닙니다.</li>
            <li>비공개 영상, 삭제된 영상, 비공개 채널의 URL은 작동하지 않습니다.</li>
          </ul>
        </div>
      </Container>
    </main>
  );
}
