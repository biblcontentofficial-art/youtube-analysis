import type { Metadata } from "next";
import { analyzeChannel } from "./actions";
import type { ChannelAnalysis } from "./actions";
import ChannelSearchForm from "./_components/ChannelSearchForm";
import ChannelDashboard from "./_components/ChannelDashboard";

export const metadata: Metadata = {
  title: "내 채널 분석 | 비블랩",
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
      errorMessage = result.error;
    } else {
      analysisData = result;
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-6">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">내 채널 분석</h1>
          <p className="text-sm text-gray-500">
            채널 URL이나 핸들을 입력하면 성과 데이터를 분석합니다
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="mb-8">
          <ChannelSearchForm />
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="max-w-xl mx-auto mb-8 p-5 bg-red-950/50 border border-red-800 rounded-xl text-center">
            <p className="text-red-300 font-semibold mb-1">분석 실패</p>
            <p className="text-gray-400 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Dashboard */}
        {analysisData && <ChannelDashboard data={analysisData} />}

        {/* Empty State */}
        {!channelInput && !analysisData && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-5 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-gray-600"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-400 mb-2">
              채널을 입력하고 분석을 시작하세요
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              구독자 수, 조회수 추이, 업로드 주기, 최적 업로드 시간 등
              채널의 핵심 성과 지표를 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
