import type { Metadata } from "next";
import CalculatorClient from "./_components/CalculatorClient";

export const metadata: Metadata = {
  title: "유튜브 비율 계산기 (사용자 자가 도구)",
  description:
    "유튜브 영상 URL을 입력하면 클라이언트에서 비율을 직접 계산합니다. bibl lab이 제공하는 메트릭이 아닌, 사용자가 직접 실행하는 도구입니다.",
  alternates: { canonical: "https://bibllab.com/tools/calculator" },
  robots: { index: true, follow: true },
};

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs text-teal-400 bg-teal-950/40 border border-teal-800/60 px-3 py-1.5 rounded-full mb-4">
            🛠️ Tools
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            유튜브 비율 계산기
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            영상 URL을 입력하고 원하는 계산 버튼을 누르세요. 모든 계산은
            <strong className="text-white"> 사용자가 직접 실행</strong>하며,
            결과는 <strong className="text-white">사용자의 브라우저에서 단순 산술로 계산</strong>한 값입니다.
          </p>
        </div>

        {/* 명확한 디스클레이머 박스 */}
        <div className="mb-8 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl">
          <h2 className="text-sm font-bold text-amber-300 mb-2">⚠️ 사용 안내</h2>
          <ul className="text-xs text-gray-400 space-y-1 leading-relaxed list-disc list-inside">
            <li>이 도구는 사용자가 명시적으로 버튼을 클릭할 때만 동작합니다.</li>
            <li>계산 결과는 YouTube가 제공하는 공식 메트릭이 아닙니다.</li>
            <li>bibl lab은 어떠한 평가/등급/예측 점수도 제공하지 않습니다. 단지 사용자가 자가 계산하는 도구만 제공합니다.</li>
            <li>YouTube API가 반환한 raw 데이터는 사용자의 브라우저에서 단순 산술(나눗셈, 곱셈)로 처리됩니다.</li>
          </ul>
        </div>

        {/* 계산기 본체 */}
        <CalculatorClient />

        {/* 하단 안내 */}
        <div className="mt-12 p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">💡 활용 팁</h3>
          <ul className="text-xs text-gray-400 space-y-1.5 leading-relaxed list-disc list-inside">
            <li>계산 결과는 영상 기획·벤치마킹용 참고 값입니다.</li>
            <li>채널마다 평균값의 의미가 다르므로 절대적인 기준이 아닙니다.</li>
            <li>비공개 영상, 삭제된 영상, 비공개 채널의 URL은 작동하지 않습니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
