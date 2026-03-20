import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { getTrendingVideos, TrendingVideo } from "@/lib/youtube";
import { PLANS, PlanKey } from "@/lib/stripe";

export default async function TrendingPage() {
  const { sessionClaims } = await auth();
  const plan = (sessionClaims?.publicMetadata as Record<string, string> | undefined)?.plan ?? "free";
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;

  if (!planData.canTrending) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">📊</div>
          <h1 className="text-2xl font-bold">트렌드 분석</h1>
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

  const isPaid = plan !== "free";
  const { items: videos, error } = await getTrendingVideos(isPaid, 50);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">📊 한국 트렌드 분석</h1>
            <p className="text-xs text-gray-500 mt-0.5">YouTube 한국 인기 급상승 동영상 실시간 TOP 50</p>
          </div>
          <span className="text-xs text-gray-600">매시간 자동 갱신</span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 에러 */}
        {error === "quota_exceeded" && (
          <div className="mb-6 p-5 bg-orange-950/50 border border-orange-700 rounded-xl text-center">
            <p className="text-orange-300 font-semibold">YouTube API 일일 쿼터가 소진됐습니다</p>
            <p className="text-gray-400 text-sm mt-1">매일 한국 시간 오후 5시에 초기화됩니다.</p>
          </div>
        )}
        {error === "api_error" && (
          <div className="mb-6 p-5 bg-red-950/50 border border-red-800 rounded-xl text-center">
            <p className="text-red-300 font-semibold">데이터를 불러오는 중 오류가 발생했습니다</p>
            <p className="text-gray-400 text-sm mt-1">잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {/* 결과 테이블 */}
        {!error && videos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-900 text-gray-500 text-xs">
                  <th className="px-3 py-3 text-center w-10">순위</th>
                  <th className="px-3 py-3 text-left">영상</th>
                  <th className="px-3 py-3 text-right">조회수</th>
                  <th className="px-3 py-3 text-right hidden md:table-cell">구독자</th>
                  <th className="px-3 py-3 text-center hidden md:table-cell">길이</th>
                  <th className="px-3 py-3 text-center hidden lg:table-cell">게시일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {videos.map((v, i) => (
                  <TrendingRow key={v.videoId} video={v} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function TrendingRow({ video, rank }: { video: TrendingVideo; rank: number }) {
  const isShorts = video.durationSeconds > 0 && video.durationSeconds <= 180;
  return (
    <tr className="bg-gray-900/30 hover:bg-gray-900/60 transition-colors">
      <td className="px-3 py-3 text-center">
        <span className={`font-bold text-sm ${
          rank <= 3 ? "text-yellow-400" :
          rank <= 10 ? "text-teal-400" :
          "text-gray-500"
        }`}>
          {rank}
        </span>
      </td>
      <td className="px-3 py-3">
        <a
          href={`https://youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 group"
        >
          <div className="relative shrink-0">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-24 h-14 object-cover rounded-md"
            />
            {isShorts && (
              <span className="absolute bottom-1 right-1 text-[9px] bg-red-600 text-white px-1 rounded">Shorts</span>
            )}
            {!isShorts && video.duration && (
              <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 text-white px-1 rounded">{video.duration}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-teal-300 transition-colors">
              {video.title}
            </p>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5">
              {video.channelThumbnail && (
                <img src={video.channelThumbnail} alt="" className="w-4 h-4 rounded-full" />
              )}
              {video.channelTitle}
            </p>
          </div>
        </a>
      </td>
      <td className="px-3 py-3 text-right text-gray-300 whitespace-nowrap font-medium">
        {video.viewCountFormatted}
      </td>
      <td className="px-3 py-3 text-right text-gray-400 whitespace-nowrap hidden md:table-cell">
        {video.subscriberCountFormatted}
      </td>
      <td className="px-3 py-3 text-center text-gray-500 whitespace-nowrap hidden md:table-cell">
        {isShorts ? <span className="text-red-400 text-xs">Shorts</span> : (video.duration || "-")}
      </td>
      <td className="px-3 py-3 text-center text-gray-500 text-xs whitespace-nowrap hidden lg:table-cell">
        {video.publishedAt}
      </td>
    </tr>
  );
}
