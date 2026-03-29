import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { searchChannels, ChannelResult } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "유튜브 채널 찾기 · 성장 채널 발견",
  description:
    "비블랩 채널 찾기 — 주제·분야 키워드로 구독자 급상승·신생 고성장 유튜브 채널을 발굴하세요. 협업 채널, 벤치마킹 채널을 빠르게 찾습니다.",
  keywords: [
    "비블랩 채널찾기", "유튜브 채널 분석", "유튜브 채널 찾기", "구독자 급상승 채널",
    "신생 유튜브 채널", "유튜브 채널 발굴", "성장 채널 탐색", "유튜브 협업 채널",
  ],
  alternates: { canonical: "https://bibllab.com/channels" },
  openGraph: {
    title: "유튜브 채널 찾기 · 성장 채널 발견 | 비블랩",
    description: "키워드로 구독자 급상승·신생 채널을 찾아보세요.",
    url: "https://bibllab.com/channels",
  },
};
import { PLANS, PlanKey } from "@/lib/stripe";
import { getChannelUsage, incrementChannelCount } from "@/lib/channelLimit";
import ChannelSearchBar from "./_components/ChannelSearchBar";
import FilterTabs, { SortMode } from "./_components/FilterTabs";
import DateSortToggle from "./_components/DateSortToggle";

type DateOrder = "asc" | "desc" | null;

interface Props {
  searchParams: { q?: string; sort?: string; dateOrder?: string };
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function channelAgeMonths(publishedAt: string): number {
  if (!publishedAt) return 9999;
  return Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function formatOpenDate(publishedAt: string): string {
  if (!publishedAt) return "-";
  const d = new Date(publishedAt);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}. ${m}. ${day}.`;
}

function fmtNum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function sortChannels(
  items: ChannelResult[],
  sort: SortMode,
  dateOrder: DateOrder = null
): ChannelResult[] {
  const list = [...items];

  if (sort === "trending")
    return list.sort(
      (a, b) =>
        b.viewCount / Math.max(b.subscriberCount, 1) -
        a.viewCount / Math.max(a.subscriberCount, 1)
    );

  if (sort === "growth")
    return list.sort(
      (a, b) =>
        b.subscriberCount / channelAgeMonths(b.publishedAt) -
        a.subscriberCount / channelAgeMonths(a.publishedAt)
    );

  if (sort === "new") {
    // 개설일 정렬 필터가 활성화된 경우
    if (dateOrder) {
      return list.sort((a, b) => {
        const ta = new Date(a.publishedAt || 0).getTime();
        const tb = new Date(b.publishedAt || 0).getTime();
        return dateOrder === "asc" ? ta - tb : tb - ta;
      });
    }
    // 기본: 신생(3년 이내) 채널 우선 → 영상당 평균 조회수 순
    const isNew = (c: ChannelResult) => channelAgeMonths(c.publishedAt) <= 36;
    return [
      ...list.filter(isNew).sort((a, b) => b.avgViewsPerVideo - a.avgViewsPerVideo),
      ...list.filter((c) => !isNew(c)).sort((a, b) => b.avgViewsPerVideo - a.avgViewsPerVideo),
    ];
  }

  return list;
}

// ─── 지표 색상 ─────────────────────────────────────────────────────────────────

function metricColor(val: number, hi: number, mid: number, lo: number): string {
  if (val >= hi) return "text-purple-400 font-bold";
  if (val >= mid) return "text-red-400 font-semibold";
  if (val >= lo) return "text-orange-400 font-semibold";
  return "text-gray-300";
}

// ─── 빈 상태 ─────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-20 px-4 max-w-2xl mx-auto">
      <p className="text-center text-gray-500 text-sm mb-10">
        분야 키워드를 검색하면 그 분야에서 성장 중인 채널을 한눈에 비교할 수 있어요
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: (
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-orange-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
              </svg>
            ),
            label: "영상 평균 조회수 순",
            desc: "채널 전체 영상의 영상당 평균 조회수가 높은 순으로 정렬합니다. 콘텐츠 하나하나가 잘 터지는 채널을 찾아보세요.",
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-blue-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            ),
            label: "월 구독자 증가량 순",
            desc: "구독자 수 ÷ 채널 개설 월수로 계산한 월평균 구독자 증가량이 많은 순으로 정렬합니다.",
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-green-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            ),
            label: "신생 채널 · 평균 조회수 순",
            desc: "개설 3년 이내 채널을 우선으로, 영상당 평균 조회수 높은 순으로 정렬합니다.",
          },
        ].map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="mb-3">{c.icon}</div>
            <p className="text-sm font-semibold text-white mb-2">{c.label}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default async function ChannelsPage({ searchParams }: Props) {
  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;

  const query = searchParams.q?.trim() || "";
  const rawSort = searchParams.sort ?? "trending";
  const sort: SortMode = (["trending", "growth", "new"] as SortMode[]).includes(rawSort as SortMode)
    ? (rawSort as SortMode)
    : "trending";
  const rawDateOrder = searchParams.dateOrder;
  const dateOrder: DateOrder =
    rawDateOrder === "asc" || rawDateOrder === "desc" ? rawDateOrder : null;

  // 사용량 조회 (검색 전 항상 확인)
  const usage = await getChannelUsage();

  let channels: ChannelResult[] = [];
  let apiError: string | null = null;
  let limitError: string | null = null;

  if (query) {
    if (!usage.unlimited && usage.used >= usage.limit) {
      // 한도 초과 — API 호출 없이 차단
      limitError = "limit_exceeded";
    } else {
      // 카운트 증가 후 검색
      await incrementChannelCount();
      const result = await searchChannels(query, plan !== "free");
      if (result.error === "quota_exceeded") {
        apiError = "YouTube API 일일 쿼터가 소진됐습니다. 잠시 후 다시 시도해주세요.";
      } else if (result.error === "api_error") {
        apiError = "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else {
        channels = sortChannels(result.items, sort, dateOrder);
      }
    }
  }

  // 컬럼 레이블
  const metricLabel: Record<SortMode, string> = {
    trending: "영상당 평균 조회",
    growth: "월 구독자 증가",
    new: "영상당 평균 조회",
  };

  const remaining = usage.unlimited ? null : Math.max(0, usage.limit - usage.used);
  const isLow = remaining !== null && remaining <= 5;
  const isOut = remaining !== null && remaining === 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 상단 검색 + 필터 */}
      <div className="border-b border-gray-800 bg-gray-900/50 px-4 py-4">
        <div className="max-w-screen-xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <ChannelSearchBar initialQuery={query} />
            {/* 사용량 뱃지 */}
            {usage.unlimited ? (
              <span className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-teal-800 bg-teal-950/40 text-teal-400 shrink-0">
                ✨ 무제한
              </span>
            ) : (
              <Link
                href="/pricing"
                className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition shrink-0 ${
                  isOut
                    ? "border-red-700 bg-red-950/50 text-red-400"
                    : isLow
                    ? "border-amber-700 bg-amber-950/50 text-amber-400"
                    : "border-gray-700 bg-gray-900 text-gray-400"
                }`}
                title={usage.isDaily ? "오늘 채널 검색 가능 횟수" : "이번 달 채널 검색 가능 횟수"}
              >
                <span>{isOut ? "🚫" : isLow ? "⚠️" : "📺"}</span>
                <span>{isOut ? "이번 달 한도 초과" : `${remaining}회 남음`}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FilterTabs current={sort} query={query} />

            {/* 신생 고성장 탭 전용: 채널 개설일 정렬 토글 */}
            {sort === "new" && (
              <DateSortToggle query={query} dateOrder={dateOrder} />
            )}

            {query && channels.length > 0 && (
              <span className="text-xs text-gray-600 hidden md:block">
                {sort === "trending" && "영상당 평균 조회수 기준"}
                {sort === "growth" && "채널 나이 대비 월 평균 구독자 증가량 기준"}
                {sort === "new" && !dateOrder && "3년 이내 개설 채널 우선 · 영상당 평균 조회수 기준"}
                {sort === "new" && dateOrder === "desc" && "채널 개설일 최신순"}
                {sort === "new" && dateOrder === "asc" && "채널 개설일 오래된순"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 한도 초과 */}
        {limitError === "limit_exceeded" && (
          <div className="mb-6 p-6 bg-gray-900 border border-gray-700 rounded-xl text-center space-y-3">
            <p className="text-2xl">🚫</p>
            <p className="text-white font-semibold">{usage.isDaily ? "오늘 채널 검색 횟수를 모두 사용했어요" : "이번 달 채널 검색 횟수를 모두 사용했어요"}</p>
            <p className="text-gray-400 text-sm">
              현재 플랜: <span className="font-medium text-gray-200">{usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)}</span>
              &nbsp;·&nbsp; 사용: <span className="font-medium text-gray-200">{usage.used}/{usage.limit}회</span>
            </p>
            <p className="text-gray-500 text-xs">{usage.isDaily ? "내일 자정에 횟수가 초기화되거나, 플랜을 업그레이드하면 더 많이 사용할 수 있어요." : "다음 달 1일에 횟수가 초기화되거나, 플랜을 업그레이드하면 더 많이 사용할 수 있어요."}</p>
            <Link
              href="/pricing"
              className="inline-block mt-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
            >
              플랜 업그레이드 →
            </Link>
          </div>
        )}

        {/* API 에러 */}
        {apiError && (
          <div className="p-5 bg-orange-950/50 border border-orange-700 rounded-xl text-center mb-6">
            <p className="text-orange-300 font-semibold">{apiError}</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!query && <EmptyState />}

        {/* 결과 없음 */}
        {query && !apiError && channels.length === 0 && (
          <div className="p-12 text-center border border-gray-800 rounded-xl bg-gray-900/50">
            <p className="text-gray-400">검색 결과가 없어요</p>
            <p className="text-gray-600 text-sm mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {/* 신생 고성장 안내 */}
        {sort === "new" && channels.length > 0 && (() => {
          if (dateOrder) {
            return (
              <p className="text-xs mb-4 text-teal-500">
                {dateOrder === "desc"
                  ? "📅 채널 개설일 최신순으로 정렬됩니다"
                  : "📅 채널 개설일 오래된순으로 정렬됩니다"}
              </p>
            );
          }
          const n = channels.filter((ch) => channelAgeMonths(ch.publishedAt) <= 36).length;
          return (
            <p className={`text-xs mb-4 ${n > 0 ? "text-green-500" : "text-gray-500"}`}>
              {n > 0
                ? `🌱 3년 이내 신생 채널 ${n}개가 상단에 표시됩니다`
                : "이 키워드에서 3년 이내 신생 채널이 없어 전체를 평균 조회수 순으로 표시합니다."}
            </p>
          );
        })()}

        {/* ─── 결과 테이블 ─────────────────────────────────────────────────── */}
        {channels.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm border-collapse">
              {/* 헤더 */}
              <thead>
                <tr className="bg-gray-900/80 border-b border-gray-800 text-gray-500 text-xs">
                  <th className="px-5 py-3 text-left w-8 font-normal">#</th>
                  <th className="px-4 py-3 text-left font-normal">채널</th>
                  <th className="px-4 py-3 text-right font-normal whitespace-nowrap">
                    <span className={sort === "growth" || sort === "trending" ? "text-teal-400" : ""}>
                      구독자 수
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-normal whitespace-nowrap">
                    <span className={sort === "trending" ? "text-teal-400 flex items-center justify-end gap-1" : "flex items-center justify-end gap-1"}>
                      {metricLabel[sort]}
                      <svg className="w-3 h-3 text-teal-500" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 12L2 5h12L8 12z"/>
                      </svg>
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-normal whitespace-nowrap hidden md:table-cell">
                    영상 수
                  </th>
                  <th className="px-4 py-3 text-right font-normal whitespace-nowrap hidden md:table-cell">
                    채널 개설일
                  </th>
                  <th className="px-4 py-3 text-left font-normal hidden lg:table-cell">
                    설명
                  </th>
                </tr>
              </thead>

              {/* 바디 */}
              <tbody>
                {channels.map((ch, i) => {
                  const ageM = channelAgeMonths(ch.publishedAt);
                  const isNew = ageM <= 36;
                  const viralRatio = Math.round(ch.viewCount / Math.max(ch.subscriberCount, 1));
                  const spm = Math.round(ch.subscriberCount / Math.max(ageM, 1));

                  return (
                    <tr
                      key={ch.channelId}
                      className={`border-b border-gray-800/60 transition-colors group
                        ${isNew && sort === "new"
                          ? "bg-green-950/10 hover:bg-green-950/20"
                          : "hover:bg-gray-800/30"
                        }`}
                    >
                      {/* 순위 */}
                      <td className="px-5 py-4 text-gray-600 text-xs font-mono align-middle">
                        {i + 1}
                      </td>

                      {/* 채널 정보 */}
                      <td className="px-4 py-4 align-middle">
                        <Link
                          href={`/channels/${ch.channelId}?from=${encodeURIComponent(`/channels?q=${encodeURIComponent(query)}&sort=${sort}${dateOrder ? `&dateOrder=${dateOrder}` : ""}`)}`}
                          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                        >
                          {/* 썸네일 */}
                          <div className="relative shrink-0">
                            {ch.thumbnail ? (
                              <img
                                src={ch.thumbnail}
                                alt={ch.title}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-700 group-hover:ring-teal-600 transition"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl ring-2 ring-gray-700">
                                📺
                              </div>
                            )}
                            {isNew && (
                              <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                                NEW
                              </span>
                            )}
                          </div>

                          {/* 이름 + 태그 */}
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate max-w-[200px] group-hover:text-teal-400 transition">
                              {ch.title}
                            </p>
                            {ch.customUrl && (
                              <p className="text-gray-500 text-xs truncate mt-0.5">{ch.customUrl}</p>
                            )}
                            {/* 카테고리 태그 */}
                            {ch.topicTags.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {ch.topicTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* 구독자 */}
                      <td className="px-4 py-4 text-right align-middle whitespace-nowrap">
                        <span className="text-gray-200 font-semibold tabular-nums">
                          {ch.subscriberCountFormatted}
                        </span>
                      </td>

                      {/* 핵심 지표 */}
                      <td className="px-4 py-4 text-right align-middle whitespace-nowrap">
                        {sort === "trending" && (
                          <span className={metricColor(viralRatio, 200, 80, 30) + " tabular-nums"}>
                            {fmtNum(viralRatio)}배
                          </span>
                        )}
                        {sort === "growth" && (
                          <span className={metricColor(spm, 50000, 10000, 3000) + " tabular-nums"}>
                            +{fmtNum(spm)}/월
                          </span>
                        )}
                        {sort === "new" && (
                          <span className={metricColor(ch.avgViewsPerVideo, 500000, 100000, 30000) + " tabular-nums"}>
                            {fmtNum(ch.avgViewsPerVideo)}회
                          </span>
                        )}
                      </td>

                      {/* 영상 수 */}
                      <td className="px-4 py-4 text-right text-gray-400 whitespace-nowrap hidden md:table-cell align-middle tabular-nums">
                        {ch.videoCount.toLocaleString()}개
                      </td>

                      {/* 채널 개설일 */}
                      <td className="px-4 py-4 text-right whitespace-nowrap hidden md:table-cell align-middle">
                        <span className={`text-xs tabular-nums ${isNew ? "text-green-400" : "text-gray-500"}`}>
                          {formatOpenDate(ch.publishedAt)}
                        </span>
                      </td>

                      {/* 설명 */}
                      <td className="px-4 py-4 text-gray-500 text-xs hidden lg:table-cell align-middle max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{ch.description}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
