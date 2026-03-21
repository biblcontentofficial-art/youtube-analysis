import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { searchChannels, ChannelResult } from "@/lib/youtube";
import { PLANS, PlanKey } from "@/lib/stripe";
import ChannelSearchBar from "./_components/ChannelSearchBar";

interface Props {
  searchParams: { q?: string };
}

export default async function ChannelsPage({ searchParams }: Props) {
  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;

  if (!planData.canChannelSearch) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">📺</div>
          <h1 className="text-2xl font-bold">채널 찾기</h1>
          <p className="text-gray-400 text-sm">Starter 플랜부터 사용 가능한 기능입니다.</p>
          <Link
            href="/pricing"
            className="inline-block bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            플랜 업그레이드 →
          </Link>
        </div>
      </main>
    );
  }

  const query = searchParams.q?.trim() || "";
  let channels: ChannelResult[] = [];
  let apiError: string | null = null;

  if (query) {
    const isPaid = plan !== "free";
    const result = await searchChannels(query, isPaid);
    if (result.error === "quota_exceeded") {
      apiError = "YouTube API 일일 쿼터가 소진됐습니다. 잠시 후 다시 시도해주세요.";
    } else if (result.error === "api_error") {
      apiError = "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    } else {
      channels = result.items;
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          <ChannelSearchBar initialQuery={query} />
          {query && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/50 border border-teal-700 rounded-full text-sm text-teal-300 shrink-0">
              📺 {query}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 에러 */}
        {apiError && (
          <div className="mb-6 p-5 bg-orange-950/50 border border-orange-700 rounded-xl text-center">
            <p className="text-orange-300 font-semibold">{apiError}</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!query && (
          <div className="p-16 text-center">
            <div className="text-5xl mb-4">📺</div>
            <p className="text-gray-400 font-medium">채널 키워드를 검색해보세요</p>
            <p className="text-gray-600 text-sm mt-1">구독자수, 평균 조회수를 한눈에 비교할 수 있습니다</p>
          </div>
        )}

        {/* 결과 없음 */}
        {query && !apiError && channels.length === 0 && (
          <div className="p-12 text-center border border-gray-800 rounded-xl bg-gray-900/50">
            <p className="text-gray-400">검색 결과가 없어요</p>
            <p className="text-gray-600 text-sm mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {/* 결과 테이블 */}
        {channels.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-900 text-gray-500 text-xs">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">채널</th>
                  <th className="px-4 py-3 text-right">구독자</th>
                  <th className="px-4 py-3 text-right">영상 수</th>
                  <th className="px-4 py-3 text-right">영상당 평균 조회수</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">설명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {channels.map((ch, i) => (
                  <tr key={ch.channelId} className="bg-gray-900/30 hover:bg-gray-900/60 transition-colors">
                    <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://youtube.com/channel/${ch.channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        {ch.thumbnail ? (
                          <img src={ch.thumbnail} alt={ch.title} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                            <span className="text-lg">📺</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-[200px]">{ch.title}</p>
                          {ch.customUrl && (
                            <p className="text-gray-500 text-xs truncate">{ch.customUrl}</p>
                          )}
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">
                      {ch.subscriberCountFormatted}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                      {ch.videoCount.toLocaleString()}개
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-semibold ${
                        ch.avgViewsPerVideo > 100000 ? "text-purple-400" :
                        ch.avgViewsPerVideo > 30000 ? "text-red-400" :
                        ch.avgViewsPerVideo > 10000 ? "text-green-400" :
                        "text-gray-400"
                      }`}>
                        {ch.avgViewsFormatted}회
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-xs">
                      <p className="line-clamp-2">{ch.description}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
