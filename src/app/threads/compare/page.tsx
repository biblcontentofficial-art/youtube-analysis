import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getThreadsConnection } from "@/lib/db";
import { searchThreads } from "@/lib/threads";
import { searchVideos } from "@/lib/youtube";
import CompareSearchForm from "./_components/CompareSearchForm";
import CompareDashboard from "./_components/CompareDashboard";

export const metadata: Metadata = {
  title: "크로스플랫폼 비교 · 유튜브 vs 스레드",
  description: "비블랩 — 같은 키워드를 유튜브와 스레드에서 동시 비교하고 콘텐츠 전환 전략을 세워보세요.",
};

interface Props {
  searchParams: { q?: string };
}

export default async function ComparePage({ searchParams }: Props) {
  const keyword = (searchParams.q ?? "").trim();
  const { userId } = await auth();

  let compareData = null;

  if (keyword && userId) {
    const connection = await getThreadsConnection(userId);

    const [youtubeResult, threadsResult] = await Promise.allSettled([
      searchVideos(keyword).catch(() => null),
      connection
        ? searchThreads(keyword, connection.access_token).catch(() => null)
        : Promise.resolve(null),
    ]);

    const ytData = youtubeResult.status === "fulfilled" ? youtubeResult.value : null;
    const ytItems = ytData?.items ?? [];
    const ytViews = ytItems.map((v) => v.viewCount ?? 0);
    const ytAvgViews =
      ytViews.length > 0
        ? Math.round(ytViews.reduce((a, b) => a + b, 0) / ytViews.length)
        : 0;

    const thData = threadsResult.status === "fulfilled" ? threadsResult.value : null;
    const thPosts = thData?.posts ?? [];
    const thEngagements = thPosts.map(
      (p) => p.like_count + p.repost_count + p.replies_count
    );
    const thAvgEng =
      thEngagements.length > 0
        ? Math.round(thEngagements.reduce((a, b) => a + b, 0) / thEngagements.length)
        : 0;
    const thAvgViral =
      thPosts.length > 0
        ? Math.round(thPosts.reduce((s, p) => s + p.viralScore, 0) / thPosts.length)
        : 0;

    compareData = {
      keyword,
      youtube: {
        available: ytItems.length > 0,
        count: ytItems.length,
        avgViews: ytAvgViews,
        maxViews: ytViews.length > 0 ? Math.max(...ytViews) : 0,
      },
      threads: {
        available: thPosts.length > 0,
        connected: !!connection,
        count: thPosts.length,
        avgEngagement: thAvgEng,
        avgViralScore: thAvgViral,
        maxEngagement: thEngagements.length > 0 ? Math.max(...thEngagements) : 0,
      },
    };
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">vs</span>
              <h1 className="text-lg font-semibold">크로스플랫폼 비교</h1>
            </div>
            <p className="text-xs text-gray-500">
              같은 키워드를 유튜브와 스레드에서 동시 비교하세요
            </p>
          </div>
          <a
            href="/threads"
            className="text-xs text-gray-500 hover:text-gray-300 transition px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg"
          >
            ← 스레드 검색
          </a>
        </div>

        {/* 비로그인 */}
        {!userId && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-3">로그인 후 비교 기능을 이용할 수 있어요</p>
            <a href="/sign-in" className="text-xs bg-teal-600 text-white px-4 py-2 rounded-lg">로그인</a>
          </div>
        )}

        {/* 로그인 상태 */}
        {userId && (
          <div className="space-y-6">
            <CompareSearchForm defaultValue={keyword} />

            {!keyword && (
              <div className="text-center py-16">
                <div className="text-3xl mb-3 opacity-30">vs</div>
                <p className="text-gray-500 text-sm">키워드를 입력하면 유튜브와 스레드를 동시에 비교합니다</p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {["다이어트", "재테크", "자기계발", "마케팅", "부업"].map((kw) => (
                    <a
                      key={kw}
                      href={`/threads/compare?q=${encodeURIComponent(kw)}`}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-full transition"
                    >
                      {kw}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {keyword && compareData && (
              <CompareDashboard data={compareData} />
            )}

            {keyword && !compareData && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">비교 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
