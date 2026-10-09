import type { Metadata } from "next";
import { analyzeChannel } from "./actions";
import type { ChannelAnalysis } from "./actions";
import ChannelSearchForm from "./_components/ChannelSearchForm";
import ChannelDashboard from "./_components/ChannelDashboard";
import { WarningIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";

/** 서버 액션이 돌려주는 준비된 한국어 문구. 그 밖(영어 원문 등)은 화면에 그대로 내지 않는다 */
const KNOWN_ERRORS = [
  "채널을 찾을 수 없습니다. URL이나 핸들을 다시 확인해주세요.",
  "채널 정보를 가져올 수 없습니다.",
  "채널 분석 중 오류가 발생했습니다.",
];

function displayError(raw: string): string {
  if (KNOWN_ERRORS.includes(raw)) return raw;
  return "채널 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

export const metadata: Metadata = {
  // 뒤의 '| 비블랩 (bibl lab)' 은 루트 레이아웃 template 이 붙인다
  title: "내 채널 분석",
  description:
    "유튜브 채널 URL 또는 핸들을 입력하면 구독자, 조회수, 업로드 주기, 최적 업로드 시간 등 채널 성과를 한눈에 분석합니다.",
  alternates: { canonical: "https://bibllab.com/my-channel" },
};

interface Props {
  searchParams: {
    channel?: string;
  };
}

export default async function MyChannelPage({ searchParams }: Props) {
  const channelInput = searchParams.channel || "";

  let analysisData: ChannelAnalysis | null = null;
  let errorMessage: string | null = null;

  if (channelInput) {
    const result = await analyzeChannel(channelInput);
    if ("error" in result) {
      errorMessage = displayError(result.error);
    } else {
      analysisData = result;
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* 도구 탭 없음(결정 18 기본 B): 실버 라벨 머리(DESIGN 6.4) + h1 + 안내 한 번 */}
      <div className="mx-auto w-full max-w-wide px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="ANALYSIS" className="mb-6! md:mb-8!" />
        <h1 className="text-h3 text-fg">내 채널 분석</h1>
        <p className="mt-2 text-body-sm text-fg-3 md:text-ui">
          채널 URL이나 핸들을 입력하면 성과 데이터를 분석합니다
        </p>

        <div className="mt-6">
          <ChannelSearchForm initialValue={channelInput} />
        </div>

        <div className="mt-8">
          {/* Error State (DESIGN 6.13) */}
          {errorMessage && (
            <div role="alert" className="mb-8 flex max-w-2xl gap-3 rounded-card border border-negative/55 bg-surface p-4">
              <WarningIcon className="mt-0.5 text-negative" />
              <div className="min-w-0">
                <p className="text-ui font-semibold text-negative">분석 실패</p>
                <p className="mt-0.5 text-body-sm text-fg-3">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Dashboard */}
          {analysisData && <ChannelDashboard data={analysisData} />}

          {/* Empty State (DESIGN 6.20) */}
          {!channelInput && !analysisData && (
            <div className="flex flex-col items-start gap-2 rounded-card border border-line bg-surface p-6 md:p-8">
              <h2 className="text-ui font-semibold text-fg">채널을 입력하고 분석을 시작하세요</h2>
              <p className="max-w-md text-body-sm text-fg-3">
                구독자 수, 조회수 추이, 업로드 주기, 최적 업로드 시간 등
                채널의 핵심 성과 지표를 확인할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
