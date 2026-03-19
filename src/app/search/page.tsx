import { Suspense } from "react";
import Link from "next/link";
import { searchVideos } from "@/lib/youtube";
import SearchResultList from "./_components/SearchResultList";
import SearchSkeleton from "./_components/SearchSkeleton";
import SearchBar from "../_components/SearchBar";
import { getSearchUsage, incrementSearchCount } from "@/lib/searchLimit";
import LimitModal from "./_components/LimitModal";
import KakaoChannelBanner from "./_components/KakaoChannelBanner";

interface Props {
  searchParams: {
    q?: string;
    filter?: string;
    count?: string;
    fromHistory?: string;
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || "";
  const filter = searchParams.filter || "";
  const fromHistory = searchParams.fromHistory === "1";
  const searchCount = Math.max(1, parseInt(searchParams.count || "1"));
  const pagesToFetch = Math.min(searchCount, 3);

  let videos: any[] = [];
  let nextPageToken: string | undefined;
  let limitExceeded = false;
  let apiError: "quota_exceeded" | "api_error" | null = null;

  const { used, limit, plan } = await getSearchUsage();

  const isPaid = plan !== "free";

  if (query) {
    const countResult = fromHistory ? { ok: true } : await incrementSearchCount();
    const { ok } = countResult;
    if (!ok) {
      limitExceeded = true;
    } else {
      const first = await searchVideos(query, filter, undefined, isPaid);
      if (first.error) {
        apiError = first.error;
      } else {
        videos = first.items;
        nextPageToken = first.nextPageToken;

        for (let i = 1; i < pagesToFetch && nextPageToken; i++) {
          const more = await searchVideos(query, filter, nextPageToken, isPaid);
          videos = [...videos, ...more.items];
          nextPageToken = more.nextPageToken;
        }
      }
    }
  }

  const encodedQuery = encodeURIComponent(query);
  const encodedCount = searchCount;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <LimitModal show={limitExceeded} limit={limit} />
      <KakaoChannelBanner />
      {/* 검색 바 영역 */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          <SearchBar />

          {/* 검색어 칩 + 횟수 */}
          {query && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/50 border border-teal-700 rounded-full text-sm text-teal-300">
                🔍 {query}
                {searchCount > 1 && (
                  <span className="text-[11px] font-bold bg-teal-600 text-white px-1.5 py-0.5 rounded-full ml-1">
                    {searchCount}회 검색
                  </span>
                )}
              </span>
            </div>
          )}

          {/* 검색 횟수 표시 */}
          {query && (
            <div className="text-xs text-gray-500 shrink-0">
              오늘 {used}/{limit}회 사용
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* API 에러 안내 */}
        {apiError === "quota_exceeded" && (
          <div className="mb-6 p-5 bg-orange-950/50 border border-orange-700 rounded-xl text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-orange-300 font-semibold mb-1">
              YouTube API 일일 쿼터가 소진됐습니다
            </p>
            <p className="text-gray-400 text-sm">
              매일 한국 시간 오후 5시에 초기화됩니다. 잠시 후 다시 시도해주세요.
            </p>
          </div>
        )}
        {apiError === "api_error" && (
          <div className="mb-6 p-5 bg-red-950/50 border border-red-800 rounded-xl text-center">
            <p className="text-red-300 font-semibold mb-1">검색 중 오류가 발생했습니다</p>
            <p className="text-gray-400 text-sm">잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {/* 한도 초과 안내 */}
        {limitExceeded && (
          <div className="mb-6 p-4 bg-amber-950/50 border border-amber-700 rounded-xl text-center">
            <p className="text-amber-300 font-semibold mb-1">
              오늘 검색 한도({limit}회)를 모두 사용했습니다
            </p>
            <p className="text-gray-400 text-sm mb-3">
              내일 자정에 초기화되거나, 플랜을 업그레이드하세요.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              플랜 업그레이드 →
            </Link>
          </div>
        )}

        {/* 필터 + 액션 툴바 */}
        {query && !limitExceeded && !apiError && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* 필터 탭 (count 유지) */}
            <div className="flex items-center gap-1.5">
              <FilterTab href={`/search?q=${encodedQuery}&count=${encodedCount}`} active={!filter} label="전체" />
              <FilterTab href={`/search?q=${encodedQuery}&filter=long&count=${encodedCount}`} active={filter === "long"} label="쇼츠 제외" />
              <FilterTab href={`/search?q=${encodedQuery}&filter=shorts&count=${encodedCount}`} active={filter === "shorts"} label="쇼츠만" />
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              <ActionButton label="영상 수집" icon="📥" />
              <ActionButton label="채널 제거" icon="🗑" />
              <div className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg font-mono">
                {videos.length}건
              </div>
            </div>
          </div>
        )}

        {!limitExceeded && !apiError && (
          <Suspense fallback={<SearchSkeleton />}>
            <SearchResultList
              key={`${query}-${filter}`}
              initialData={videos}
              initialToken={nextPageToken}
              query={query}
              filter={filter}
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}

function FilterTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-teal-600 text-white"
          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

function ActionButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 px-3 py-1.5 rounded-lg transition-colors">
      <span>{icon}</span>
      {label}
    </button>
  );
}
