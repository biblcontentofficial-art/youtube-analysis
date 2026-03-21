import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getTrendingVideos, TrendingVideo } from "@/lib/youtube";
import { PLANS, PlanKey } from "@/lib/stripe";

// YouTube 공식 카테고리 (한국 기준)
const CATEGORIES = [
  { id: "",   label: "전체",       emoji: "🔥" },
  { id: "10", label: "음악",       emoji: "🎵" },
  { id: "24", label: "엔터테인먼트", emoji: "🎭" },
  { id: "20", label: "게임",       emoji: "🎮" },
  { id: "17", label: "스포츠",     emoji: "⚽" },
  { id: "25", label: "뉴스/정치",  emoji: "📰" },
  { id: "28", label: "과학/기술",  emoji: "🔬" },
  { id: "27", label: "교육",       emoji: "📚" },
  { id: "1",  label: "영화/애니",  emoji: "🎬" },
  { id: "22", label: "인물/블로그", emoji: "👤" },
  { id: "23", label: "코미디",     emoji: "😄" },
  { id: "26", label: "뷰티/스타일", emoji: "💄" },
  { id: "2",  label: "자동차",     emoji: "🚗" },
  { id: "15", label: "동물",       emoji: "🐾" },
  { id: "19", label: "여행",       emoji: "✈️" },
];

interface Props {
  searchParams: { category?: string };
}

export default async function TrendingPage({ searchParams }: Props) {
  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
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
  const categoryId = searchParams.category ?? "";
  const activeCategory = CATEGORIES.find(c => c.id === categoryId) ?? CATEGORIES[0];

  const { items: videos, error } = await getTrendingVideos(isPaid, 50, categoryId);
  const isRssFallback = !error && videos.length > 0 && videos.every(v => v.viewCount === 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-white">📊 한국 트렌드 분석</h1>
              <p className="text-xs text-gray-500 mt-0.5">YouTube 한국 인기 급상승 동영상 실시간 TOP 50</p>
            </div>
            <span className="text-xs text-teal-600 bg-teal-950/50 border border-teal-900 px-2.5 py-1 rounded-full">🔄 매시간 자동 갱신</span>
          </div>
          {/* 기준 설명 배지 */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full">
              <span className="text-teal-400">📍</span> YouTube 공식 인기급상승 기준
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full">
              <span className="text-blue-400">🌏</span> 한국(KR) 지역 한정
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full">
              <span className="text-yellow-400">⚡</span> 조회수·구독자 실시간 반영
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full">
              <span className="text-purple-400">🎯</span> Shorts / 일반 영상 구분 표시
            </span>
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {CATEGORIES.map(cat => {
              const isActive = cat.id === categoryId;
              return (
                <Link
                  key={cat.id}
                  href={cat.id ? `/trending?category=${cat.id}` : "/trending"}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-900"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 현재 카테고리 표시 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{activeCategory.emoji}</span>
          <h2 className="text-sm font-semibold text-white">{activeCategory.label} 인기 급상승 TOP {videos.length || 50}</h2>
          {videos.length > 0 && (
            <span className="text-[11px] text-gray-600 ml-auto">{videos.length}개 영상</span>
          )}
        </div>

        {/* 에러 */}
        {error === "quota_exceeded" && videos.length === 0 && (
          <div className="mb-6 p-5 bg-orange-950/50 border border-orange-700 rounded-xl text-center">
            <p className="text-orange-300 font-semibold">YouTube API 일일 쿼터가 소진됐습니다</p>
            <p className="text-gray-400 text-sm mt-1">매일 한국 시간 오후 5시에 초기화됩니다.</p>
          </div>
        )}
        {error === "api_error" && videos.length === 0 && (
          <div className="mb-6 p-5 bg-red-950/50 border border-red-800 rounded-xl text-center">
            <p className="text-red-300 font-semibold">데이터를 불러오는 중 오류가 발생했습니다</p>
            <p className="text-gray-400 text-sm mt-1">잠시 후 다시 시도해주세요.</p>
          </div>
        )}
        {/* 카테고리에 영상이 없는 경우 */}
        {!error && videos.length === 0 && (
          <div className="mb-6 p-8 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
            <p className="text-3xl mb-3">{activeCategory.emoji}</p>
            <p className="text-gray-400 font-medium">{activeCategory.label} 카테고리에 현재 급상승 영상이 없습니다</p>
            <p className="text-gray-600 text-sm mt-1">다른 카테고리를 선택하거나 잠시 후 다시 확인해주세요.</p>
          </div>
        )}
        {/* RSS 폴백 안내 */}
        {isRssFallback && (
          <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-xl text-center">
            <p className="text-gray-400 text-xs">📡 일부 데이터(조회수 등)는 현재 제공되지 않습니다. 매일 오후 5시 이후 정상화됩니다.</p>
          </div>
        )}

        {/* 결과 테이블 */}
        {videos.length > 0 && (
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
          {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
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
              <span className="absolute bottom-1 right-1 text-[9px] bg-red-600 text-white px-1 rounded font-bold">Shorts</span>
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
        {video.viewCount > 0 ? video.viewCountFormatted : "-"}
      </td>
      <td className="px-3 py-3 text-right text-gray-400 whitespace-nowrap hidden md:table-cell">
        {video.subscriberCount > 0 ? video.subscriberCountFormatted : "-"}
      </td>
      <td className="px-3 py-3 text-center text-gray-500 whitespace-nowrap hidden md:table-cell">
        {isShorts ? <span className="text-red-400 text-xs font-medium">Shorts</span> : (video.duration || "-")}
      </td>
      <td className="px-3 py-3 text-center text-gray-500 text-xs whitespace-nowrap hidden lg:table-cell">
        {video.publishedAt}
      </td>
    </tr>
  );
}
