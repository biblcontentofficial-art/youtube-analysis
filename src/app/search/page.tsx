import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { OG_DEFAULT } from "@/lib/seo";
import { searchVideos } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "유튜브 영상 찾기 · 키워드 검색",
  description:
    "비블랩 영상 찾기 · 유튜브 키워드로 최신 영상을 검색하고 조회수·구독자 수·게시일을 한눈에 확인합니다. 경쟁력 있는 콘텐츠 주제를 발견하세요.",
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
import { getLimitCopy, STARTER } from "./_components/limitCopy";
import KakaoChannelBanner from "./_components/KakaoChannelBanner";
import { PLANS, PlanKey } from "@/lib/stripe";
import PageLoadedSignal from "./_components/PageLoadedSignal";
import ToolTabs from "../_components/ToolTabs";
import { CheckIcon, WarningIcon } from "@/components/ui/icons";

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

  // 남은 횟수 표시 (검색창 아래 안내 줄).
  const remaining = limit - used;
  // 한도를 다 쓴 상태: 검색해도 incrementSearchCount 에서 멈춰 차감되지 않는다.
  const exhausted = !unlimited && remaining <= 0;
  // caution 은 네비 배지에만 쓴다(DESIGN 3.1 '자리는 네비 한 곳'). 네비 배지는 로그인·640 이상에서만 보여서
  // 이 줄에는 숫자를 fg-3 사실로만 두고, 0회일 때만 negative 로 알린다.
  const usageClass = !unlimited && remaining <= 0 ? "text-negative" : "text-fg-3";
  const usageLabel = unlimited
    ? `${periodLabel} ${used}회 사용`
    : remaining <= 0
      ? `${periodLabel} 한도 소진 (${used}/${limit})`
      : remaining === 1
        ? `마지막 검색 남음 (${used}/${limit})`
        : `${periodLabel} ${remaining}회 남음 (${used}/${limit})`;

  // 상태 메시지 상자 (DESIGN 6.13): 1px 기능 색 테두리 + 기호·제목만 기능 색
  const STATUS_BOX = "mb-6 flex gap-3 rounded-card border bg-surface p-4 break-keep";

  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* 검색마다 key가 바뀌어 강제 리마운트 → hideLoading() 반드시 실행 */}
      <PageLoadedSignal key={`signal-${query}-${filter}-${searchVersion}`} />
      <LimitModal show={limitExceeded} limit={limit} isMonthly={isMonthly} plan={plan} />
      <KakaoChannelBanner />
      {/* 결과가 그려지면 결과 머리 '‘키워드’ 결과 N개'(SearchResultList)가 이 화면의 h1 이다 */}
      {!(query && !limitExceeded && !apiError) && <h1 className="sr-only">유튜브 영상 찾기</h1>}

      {/* 앱 셸: 도구 탭 → 검색창 (DESIGN 7.2) */}
      <ToolTabs current="/search" />

      <div className="mx-auto w-full max-w-wide px-6 pb-16 lg:px-8">
        <section aria-label="검색" className="pb-4 pt-4 lg:pb-6 lg:pt-6">
          {/* 검색 안내 줄(검색창 바로 아래): 차감 · 초기화 · 남은 횟수. 소진 상태에서는 차감이 일어나지 않으므로 차감 안내를 뺀다 */}
          <SearchBar
            hint={
              <p className="-mt-0.5 text-caption text-fg-3 break-keep sm:mt-0">
                {/* 줄이 바뀔 때 구분점이 다음 줄 맨 앞에 오지 않게 덩어리마다 끝에 붙인다 */}
                {!unlimited && !exhausted && <><span className="whitespace-nowrap">검색할 때마다 1회 차감 ·</span>{" "}</>}
                {!unlimited && <><span className="whitespace-nowrap">{limitCopy.reset} ·</span>{" "}</>}
                <span className={`tnum whitespace-nowrap ${usageClass}`}>{usageLabel}</span>
                {/* 마지막 1회·소진일 때 요금제로 (네비 사용량 배지 '한도 초과 · 업그레이드'와 같은 이동) */}
                {!unlimited && remaining <= 1 && (
                  <Link
                    href="/pricing"
                    className="ml-2 font-semibold text-fg underline underline-offset-2 transition-colors hover:text-fg-2"
                  >
                    업그레이드
                  </Link>
                )}
              </p>
            }
          />
        </section>

        {/* 플랜 업그레이드 완료 알림 */}
        {upgraded && (
          <div role="status" className={`${STATUS_BOX} border-positive/55`}>
            <CheckIcon className="mt-0.5 text-positive" />
            <div>
              <p className="text-ui font-semibold text-positive">플랜 업그레이드 완료</p>
              <p className="mt-0.5 text-body-sm text-fg-3">
                플랜이 적용되었습니다. 결제 내역은{" "}
                <Link href="/mypage" className="font-semibold text-fg underline underline-offset-2 transition-colors hover:text-fg-2">
                  마이페이지
                </Link>
                에서 확인할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* API 에러 안내 */}
        {apiError === "quota_exceeded" && (
          <div role="alert" className={`${STATUS_BOX} border-caution/55`}>
            <WarningIcon className="mt-0.5 text-caution" />
            <div>
              <p className="text-ui font-semibold text-caution">일일 검색 용량이 소진됐습니다</p>
              {/* YouTube API 쿼터는 미국 태평양 시간 기준으로 초기화된다(서머타임 기간에는 한 시간 이르다) */}
              <p className="mt-0.5 text-body-sm text-fg-3">
                매일 한국 시간 오후 5시(미국 서머타임 기간인 3월 중순~11월 초에는 오후 4시)에 초기화됩니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>
          </div>
        )}
        {apiError === "api_error" && (
          <div role="alert" className={`${STATUS_BOX} border-negative/55`}>
            <WarningIcon className="mt-0.5 text-negative" />
            <div>
              <p className="text-ui font-semibold text-negative">검색 중 오류가 발생했습니다</p>
              <p className="mt-0.5 text-body-sm text-fg-3">잠시 후 다시 시도해주세요. 반복될 경우 고객센터로 문의해주세요.</p>
            </div>
          </div>
        )}

        {/* 한도 초과 안내 (모달과 같은 문구 상수) */}
        {limitExceeded && <LimitNotice limit={limit} isMonthly={isMonthly} plan={plan} />}

        {/* 검색어 없이 열었을 때: 결과 목록 대신 시작 안내 ("검색 결과가 없어요"는 실제 0건일 때만). 차감·남은 횟수는 검색창 아래 줄 */}
        {!query && (
          <section
            aria-labelledby="search-start-title"
            className="flex flex-col items-start gap-2 rounded-card border border-line bg-surface p-6 break-keep md:p-8"
          >
            <h2 id="search-start-title" className="text-ui font-semibold text-fg">영상 찾기</h2>
            <p className="text-body-sm text-fg-3">
              키워드로 최신 유튜브 영상을 수집해 조회수·구독자·게시일을 한눈에 확인합니다.
            </p>
          </section>
        )}

        {query && !limitExceeded && !apiError && (
          <>
            {/* 무료 유저 업그레이드 안내: 한 줄 문장 + 글자 링크 */}
            {!isPaid && !limitExceeded && videos.length > 0 && (
              <p className="mb-4 text-body-sm text-fg-3 break-keep">
                <span className="font-semibold text-fg-2">Starter 플랜으로 월 50회 검색 + 채널 찾기</span>
                {" · "}
                {STARTER.price} · 언제든지 취소 · 즉시 적용
                <Link
                  href="/pricing"
                  className="ml-2 whitespace-nowrap font-semibold text-fg underline underline-offset-2 transition-colors hover:text-fg-2"
                >
                  업그레이드 <span aria-hidden="true">→</span>
                </Link>
              </p>
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
                filterBase={filterBase}
                isPaid={isPaid}
              />
            </Suspense>
          </>
        )}
      </div>
    </main>
  );
}
