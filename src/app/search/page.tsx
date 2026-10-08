import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { OG_DEFAULT } from "@/lib/seo";
import { searchVideos } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "유튜브 영상 찾기 · 키워드 검색",
  description:
    "비블랩 영상 찾기 — 유튜브 키워드로 최신 영상을 검색하고 조회수·구독자 수·게시일을 한눈에 확인합니다. 경쟁력 있는 콘텐츠 주제를 발견하세요.",
  keywords: [
    "비블랩 영상검색", "유튜브 키워드 검색", "유튜브 트렌드 영상",
    "유튜브 조회수 확인", "콘텐츠 주제 발굴", "유튜브 영상 검색",
  ],
  alternates: { canonical: "https://bibllab.com/search" },
  openGraph: {
    ...OG_DEFAULT,
    title: "유튜브 영상 찾기 · 키워드 검색 | 비블랩",
    description: "유튜브 키워드로 최신 영상을 검색하고 조회수·구독자·게시일을 확인하세요.",
    url: "https://bibllab.com/search",
  },
};
import SearchResultList from "./_components/SearchResultList";
import SearchSkeleton from "./_components/SearchSkeleton";
import SearchBar from "../_components/SearchBar";
import { getSearchUsage, incrementSearchCount } from "@/lib/searchLimit";
import { cacheGet, searchCacheKey } from "@/lib/cache";
import LimitModal from "./_components/LimitModal";
import LimitNotice from "./_components/LimitNotice";
import { getLimitCopy } from "./_components/limitCopy";
import KakaoChannelBanner from "./_components/KakaoChannelBanner";
import { ActionButton } from "./_components/SearchActionButtons";
import { PLANS, PlanKey } from "@/lib/stripe";
import FilterTab from "./_components/FilterTab";
import PageLoadedSignal from "./_components/PageLoadedSignal";
import ViewStatsInline from "./_components/ViewStatsInline";
import VideoCountBadge from "./_components/VideoCountBadge";
import ShareButton from "./_components/ShareButton";
import TodaySearchCount from "./_components/TodaySearchCount";

interface Props {
  searchParams: {
    q?: string;
    filter?: string;
    fromHistory?: string;
    upgraded?: string;
    v?: string;      // 검색 버전 (같은 키워드 재검색 시 증가)
    region?: string; // 검색 국가 (기본: KR)
  };
}

// 한 번의 검색에서 초기 로드할 결과 수 (더보기로 추가 가능)
const INITIAL_RESULT_COUNT = 50;
const MAX_INITIAL_PAGES = 1; // 1페이지만 로드 → nextPageToken 보존 → 더보기 항상 가능

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || "";
  const filter = searchParams.filter ?? "all";
  const fromHistory = searchParams.fromHistory === "1";
  const upgraded = searchParams.upgraded === "1";
  const searchVersion = searchParams.v || "1";
  const region = searchParams.region || "KR";

  let videos: any[] = [];
  let limitExceeded = false;
  let apiError: "quota_exceeded" | "api_error" | null = null;

  // 더보기용 nextPageToken
  let nextPageToken: string | undefined;
  let nextPageTokenLong: string | undefined;
  let nextPageTokenShorts: string | undefined;

  let used = 0;
  let limit = 3;
  let plan: PlanKey = "free";
  let isMonthly = false;
  let unlimited = false;

  try {
    const usage = await getSearchUsage();
    used = usage.used;
    limit = usage.limit;
    plan = usage.plan;
    isMonthly = usage.isMonthly;
    unlimited = usage.unlimited;
  } catch (e) {
    console.error("[search] getSearchUsage 실패, 기본값 사용:", e);
  }

  const planData = PLANS[plan as PlanKey] ?? PLANS.free;
  const canCollect = planData.canCollect;
  const canAlgorithm = planData.canAlgorithm;
  const canChannelReport = planData.canChannelReport;
  const canLoadMore = planData.canLoadMore;
  const resultLimit = planData.resultLimit;
  const isPaid = plan !== "free";

  if (query) {
    try {
      // fromHistory=1: 필터 탭 전환 또는 히스토리 재방문
      // cache hit → API 비용 0 → 카운트 면제
      let skipCount = false;
      if (fromHistory) {
        if (filter === "all") {
          const [cLong, cShorts] = await Promise.all([
            cacheGet(searchCacheKey(query, "long", undefined, "relevance", region)),
            cacheGet(searchCacheKey(query, "shorts", undefined, "relevance", region)),
          ]);
          skipCount = cLong !== null && cShorts !== null;
        } else {
          const isCached = (await cacheGet(searchCacheKey(query, filter, undefined, "relevance", region))) !== null;
          skipCount = isCached;
        }
      }
      const countResult = skipCount ? null : await incrementSearchCount();
      const ok = countResult ? countResult.ok : true;
      if (!ok) {
        limitExceeded = true;
      } else {
        // 실제 차감 후 used/limit 갱신 (표시 정확도 — 검색 전 값 아닌 차감 후 값 표시)
        if (countResult) {
          used = countResult.used;
          limit = countResult.limit;
        }
      }
      if (ok) if (filter === "all") {
        // 전체 = 쇼츠 제외 + 쇼츠 병렬 fetch, 각 절반 목표 (플랜 결과 한도 기준)
        const initialTarget = Math.min(INITIAL_RESULT_COUNT, resultLimit);
        const half = Math.ceil(initialTarget / 2);

        const fetchHalf = async (f: "long" | "shorts", target: number) => {
          const items: any[] = [];
          let token: string | undefined;
          let pages = 0;
          let lastToken: string | undefined;
          let err: "quota_exceeded" | "api_error" | null = null;
          while (items.length < target && pages < MAX_INITIAL_PAGES) {
            const res = await searchVideos(query, f, token, isPaid, "relevance", region);
            if (res.error) { err = res.error; break; }
            const seen = new Set(items.map((v: any) => v.videoId));
            items.push(...res.items.filter((v: any) => !seen.has(v.videoId)));
            lastToken = res.nextPageToken;
            token = res.nextPageToken;
            pages++;
            if (!token) break;
          }
          return { items: items.slice(0, target), nextPageToken: lastToken, error: err };
        };

        const [longRes, shortsRes] = await Promise.all([
          fetchHalf("long", half),
          fetchHalf("shorts", initialTarget - half),
        ]);

        if (longRes.error && shortsRes.error) {
          apiError = longRes.error;
        } else {
          videos = [...longRes.items, ...shortsRes.items];
          nextPageTokenLong = longRes.nextPageToken;
          nextPageTokenShorts = shortsRes.nextPageToken;
        }
      } else {
        // 특정 필터: 최대 INITIAL_RESULT_COUNT개 로드
        const first = await searchVideos(query, filter, undefined, isPaid, "relevance", region);
        if (first.error) {
          apiError = first.error;
        } else {
          videos = first.items;
          nextPageToken = first.nextPageToken;

          const initialTarget = Math.min(INITIAL_RESULT_COUNT, resultLimit);
          let pagesLoaded = 1;
          while (videos.length < initialTarget && nextPageToken && pagesLoaded < MAX_INITIAL_PAGES) {
            const more = await searchVideos(query, filter, nextPageToken, isPaid, "relevance", region);
            if (more.error) break;
            const existingIds = new Set(videos.map((v: any) => v.videoId));
            videos = [...videos, ...more.items.filter((item: any) => !existingIds.has(item.videoId))];
            nextPageToken = more.nextPageToken;
            pagesLoaded++;
          }
          videos = videos.slice(0, initialTarget);
        }
      }
    } catch (e) {
      console.error("Search error:", e);
      apiError = "api_error";
    }
  }

  const encodedQuery = encodeURIComponent(query);
  // 필터 탭: 검색 횟수 차감 없이 이동 + 현재 버전 유지
  const filterBase = `q=${encodedQuery}&fromHistory=1&v=${searchVersion}&region=${region}`;

  // 한도 표시 레이블 (한도 모달·인라인 카드와 같은 문구 상수)
  const limitCopy = getLimitCopy(isMonthly, plan);
  const periodLabel = limitCopy.period;

  // 남은 횟수 표시 (검색 띠·시작 안내 공용). 마지막 1회는 앰버, 소진은 레드.
  const remaining = limit - used;
  // 한도를 다 쓴 상태: 검색해도 incrementSearchCount 에서 멈춰 차감되지 않는다.
  const exhausted = !unlimited && remaining <= 0;
  const usageClass = unlimited
    ? "text-neutral-400"
    : remaining <= 0
      ? "text-red-400"
      : remaining === 1
        ? "text-amber-400"
        : "text-neutral-400";
  const usageLabel = unlimited
    ? `${periodLabel} ${used}회 사용`
    : remaining <= 0
      ? `${periodLabel} 한도 소진 (${used}/${limit})`
      : remaining === 1
        ? `마지막 검색 남음 (${used}/${limit})`
        : `${periodLabel} ${remaining}회 남음 (${used}/${limit})`;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* 검색마다 key가 바뀌어 강제 리마운트 → hideLoading() 반드시 실행 */}
      <PageLoadedSignal key={`signal-${query}-${filter}-${searchVersion}`} />
      <LimitModal show={limitExceeded} limit={limit} isMonthly={isMonthly} plan={plan} />
      <KakaoChannelBanner />
      {/* 검색 바 영역 */}
      <div className="border-b border-neutral-800 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          <SearchBar />

          {/* 검색어 칩 */}
          {query && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-full text-sm text-neutral-200">
                {query}
              </span>
            </div>
          )}

          {/* 검색 횟수 표시 */}
          {query && (
            <div className={unlimited ? "text-xs shrink-0 text-neutral-400" : `text-xs shrink-0 font-medium ${usageClass}`}>
              {usageLabel}
              {!unlimited && remaining === 1 && (
                <Link href="/pricing" className="ml-2 underline underline-offset-2 text-amber-400 hover:text-amber-300">업그레이드</Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 플랜 업그레이드 완료 알림 */}
        {upgraded && (
          <div className="mb-6 p-4 border border-green-400/30 rounded-xl break-keep">
            <p className="text-green-400 font-semibold text-sm">플랜 업그레이드 완료!</p>
            <p className="text-neutral-400 text-xs mt-0.5">새로운 검색 한도가 적용됐습니다. 페이지를 새로고침하면 업데이트된 사용량이 표시됩니다.</p>
          </div>
        )}

        {/* API 에러 안내 */}
        {apiError === "quota_exceeded" && (
          <div className="mb-6 p-5 border border-amber-400/30 rounded-xl text-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 mx-auto mb-2 text-amber-400" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-amber-400 font-semibold mb-1">
              일일 검색 용량이 소진됐습니다
            </p>
            <p className="text-neutral-400 text-sm">
              매일 한국 시간 오후 5시에 초기화됩니다. 잠시 후 다시 시도해주세요.
            </p>
          </div>
        )}
        {apiError === "api_error" && (
          <div className="mb-6 p-5 bg-red-950/50 border border-red-800 rounded-xl text-center">
            <p className="text-red-300 font-semibold mb-1">검색 중 오류가 발생했습니다</p>
            <p className="text-neutral-400 text-sm">잠시 후 다시 시도해주세요. 반복될 경우 고객센터로 문의해주세요.</p>
          </div>
        )}

        {/* 한도 초과 안내 (모달과 같은 문구 상수) */}
        {limitExceeded && <LimitNotice limit={limit} isMonthly={isMonthly} plan={plan} />}

        {/* 필터 + 액션 툴바 */}
        {query && !limitExceeded && !apiError && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* 필터 탭 + 조회수 합계 (Starter 이상) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterTab href={`/search?${filterBase}`} active={filter === "all"} label="전체" />
              <FilterTab href={`/search?${filterBase}&filter=long`} active={filter === "long"} label="쇼츠 제외" />
              <FilterTab href={`/search?${filterBase}&filter=shorts`} active={filter === "shorts"} label="쇼츠만" />
              {isPaid && <ViewStatsInline />}
              <TodaySearchCount />
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {/* 채널 리포트: Pro/Business 전용 */}
              {canChannelReport ? (
                <ActionButton label="채널 리포트" icon="📊" event="TRIGGER_CHANNEL_REPORT" />
              ) : (
                <Link
                  href="/pricing"
                  title="Pro 플랜부터 사용 가능"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 text-xs cursor-pointer hover:border-neutral-600 hover:text-white transition-colors"
                >
                  <span>📊</span>
                  <span>채널 리포트</span>
                  <span className="text-xs bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Pro↑</span>
                </Link>
              )}
              {/* 영상 수집: Pro/Business 전용 */}
              {canCollect ? (
                <ActionButton label="영상 수집" icon="📥" event="TRIGGER_COLLECT" />
              ) : (
                <Link
                  href="/pricing"
                  title="Pro 플랜부터 사용 가능"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 text-xs cursor-pointer hover:border-neutral-600 hover:text-white transition-colors"
                >
                  <span>📥</span>
                  <span>영상 수집</span>
                  <span className="text-xs bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Pro↑</span>
                </Link>
              )}
              <ActionButton label="채널 제거" icon="🗑" event="TRIGGER_REMOVE_CHANNELS" />
              <ShareButton query={query} />
              <VideoCountBadge initial={videos.length} />
            </div>
          </div>
        )}

        {/* 검색어 없이 열었을 때: 결과 목록 대신 시작 안내 ("검색 결과가 없어요"는 실제 0건일 때만) */}
        {!query && (
          <section aria-labelledby="search-start-title" className="mx-auto max-w-xl py-12 md:py-20 text-center break-keep">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h2 id="search-start-title" className="mt-5 text-xl md:text-2xl font-black text-white">영상 찾기</h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-neutral-300">
              키워드로 최신 유튜브 영상을 수집해 조회수·구독자·게시일을 한눈에 확인합니다.
            </p>
            <div className="mt-8 border-t border-neutral-800 pt-6 space-y-1.5 text-sm">
              {/* 소진 상태에서는 차감이 일어나지 않으므로 차감 안내를 빼고, 남은 횟수 줄에 다음 행동(업그레이드)을 둔다 */}
              {!exhausted && <p className="text-neutral-400">확인 시 검색 사용량 1회가 차감됩니다.</p>}
              <p className={`font-medium tabular-nums ${usageClass}`}>
                {usageLabel}
                {/* 마지막 1회·소진일 때 요금제로 (네비 사용량 배지 '한도 초과 · 업그레이드'와 같은 이동) */}
                {!unlimited && remaining <= 1 && (
                  <Link
                    href="/pricing"
                    className={`ml-2 underline underline-offset-2 ${exhausted ? "text-red-400 hover:text-red-300" : "text-amber-400 hover:text-amber-300"}`}
                  >
                    업그레이드
                  </Link>
                )}
              </p>
              {!unlimited && <p className="text-xs text-neutral-400">{limitCopy.reset}</p>}
            </div>
          </section>
        )}

        {query && !limitExceeded && !apiError && (
          <>
            {/* 무료 유저 업그레이드 유도 */}
            {!isPaid && !limitExceeded && videos.length > 0 && (
              <div className="mb-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0 text-neutral-400" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-white">Starter 플랜으로 월 50회 검색 + 채널 찾기</p>
                    <p className="text-xs text-neutral-400 mt-0.5">월 ₩15,000 · 언제든지 취소 · 즉시 적용</p>
                  </div>
                </div>
                <Link href="/pricing" className="shrink-0 bg-white hover:bg-neutral-200 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                  업그레이드 →
                </Link>
              </div>
            )}
            <Suspense fallback={<SearchSkeleton />}>
              <SearchResultList
                key={`${query}-${filter}-${searchVersion}`}
                initialData={videos}
                query={query}
                filter={filter}
                region={region}
                canAlgorithm={canAlgorithm}
                canCollect={canCollect}
                canChannelReport={canChannelReport}
                canLoadMore={canLoadMore}
                resultLimit={resultLimit}
                nextPageToken={nextPageToken}
                nextPageTokenLong={nextPageTokenLong}
                nextPageTokenShorts={nextPageTokenShorts}
              />
            </Suspense>
          </>
        )}
      </div>
    </main>
  );
}
