import { Suspense } from "react";
import Link from "next/link";
import { searchVideos } from "@/lib/youtube";
import SearchResultList from "./_components/SearchResultList";
import SearchSkeleton from "./_components/SearchSkeleton";
import SearchBar from "../_components/SearchBar";
import { getSearchUsage, incrementSearchCount } from "@/lib/searchLimit";
import LimitModal from "./_components/LimitModal";
import KakaoChannelBanner from "./_components/KakaoChannelBanner";
import { ActionButton } from "./_components/SearchActionButtons";
import { PLANS, PlanKey } from "@/lib/stripe";

interface Props {
  searchParams: {
    q?: string;
    filter?: string;
    fromHistory?: string;
    upgraded?: string;
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || "";
  const filter = searchParams.filter || "";
  const fromHistory = searchParams.fromHistory === "1";
  const upgraded = searchParams.upgraded === "1";

  let videos: any[] = [];
  let nextPageToken: string | undefined;
  let limitExceeded = false;
  let apiError: "quota_exceeded" | "api_error" | null = null;

  let used = 0;
  let limit = 2;
  let plan: string = "free";

  try {
    const usage = await getSearchUsage();
    used = usage.used;
    limit = usage.limit;
    plan = usage.plan;
  } catch {
    // getSearchUsage 실패해도 기본값 사용
  }

  const planData = PLANS[plan as PlanKey] ?? PLANS.free;
  const resultLimit = planData.resultLimit;
  const canCollect = planData.canCollect;
  const canAlgorithm = planData.canAlgorithm;
  const isPaid = plan !== "free";

  // 플랜별 검색 결과 페이지 수 (50건/페이지)
  const pagesToFetch = Math.ceil(resultLimit / 50);

  if (query) {
    try {
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
    } catch (e) {
      console.error("Search error:", e);
      apiError = "api_error";
    }
  }

  const encodedQuery = encodeURIComponent(query);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <LimitModal show={limitExceeded} limit={limit} />
      <KakaoChannelBanner />
      {/* 검색 바 영역 */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          <SearchBar />

          {/* 검색어 칩 */}
          {query && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/50 border border-teal-700 rounded-full text-sm text-teal-300">
                🔍 {query}
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
        {/* 플랜 업그레이드 완료 알림 */}
        {upgraded && (
          <div className="mb-6 p-4 bg-teal-950/60 border border-teal-700 rounded-xl flex items-center gap-3">
            <span className="text-2xl shrink-0">🎉</span>
            <div>
              <p className="text-teal-300 font-semibold text-sm">플랜 업그레이드 완료!</p>
              <p className="text-gray-400 text-xs mt-0.5">새로운 검색 한도가 적용됐습니다. 페이지를 새로고침하면 업데이트된 사용량이 표시됩니다.</p>
            </div>
          </div>
        )}

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
            {/* 필터 탭 */}
            <div className="flex items-center gap-1.5">
              <FilterTab href={`/search?q=${encodedQuery}`} active={!filter} label="전체" />
              <FilterTab href={`/search?q=${encodedQuery}&filter=long`} active={filter === "long"} label="쇼츠 제외" />
              <FilterTab href={`/search?q=${encodedQuery}&filter=shorts`} active={filter === "shorts"} label="쇼츠만" />
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {/* 영상 수집: Pro/Business 전용 */}
              {canCollect ? (
                <ActionButton label="영상 수집" icon="📥" event="TRIGGER_COLLECT" />
              ) : (
                <Link
                  href="/pricing"
                  title="Pro 플랜부터 사용 가능"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-600 text-xs cursor-pointer hover:border-teal-700 hover:text-teal-400 transition-colors"
                >
                  <span>📥</span>
                  <span>영상 수집</span>
                  <span className="text-[10px] bg-gray-800 px-1 py-0.5 rounded text-gray-500">Pro↑</span>
                </Link>
              )}
              <ActionButton label="채널 제거" icon="🗑" event="TRIGGER_REMOVE_CHANNELS" />
              <div className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg font-mono">
                {videos.length}건
              </div>
            </div>
          </div>
        )}

        {!limitExceeded && !apiError && (
          <>
            {/* 무료 유저 업그레이드 유도 */}
            {!isPaid && !limitExceeded && videos.length > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-teal-950/50 to-gray-900 border border-teal-800/50 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-300">⚡ Starter 플랜으로 하루 10회 검색</p>
                  <p className="text-xs text-gray-500 mt-0.5">지금 월 ₩49,000 — 언제든지 취소 가능</p>
                </div>
                <Link href="/pricing" className="shrink-0 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                  업그레이드
                </Link>
              </div>
            )}
            <Suspense fallback={<SearchSkeleton />}>
              <SearchResultList
                key={`${query}-${filter}`}
                initialData={videos}
                initialToken={nextPageToken}
                query={query}
                filter={filter}
                canAlgorithm={canAlgorithm}
                canCollect={canCollect}
                resultLimit={resultLimit}
              />
            </Suspense>
          </>
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

