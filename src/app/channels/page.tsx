import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { searchChannels, ChannelResult } from "@/lib/youtube";
import { PLANS, PlanKey } from "@/lib/stripe";
import ChannelSearchBar from "./_components/ChannelSearchBar";
import FilterTabs, { SortMode } from "./_components/FilterTabs";

interface Props {
  searchParams: { q?: string; sort?: string };
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function channelAgeMonths(publishedAt: string): number {
  if (!publishedAt) return 9999;
  return Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function formatAge(publishedAt: string): string {
  if (!publishedAt) return "-";
  const m = channelAgeMonths(publishedAt);
  if (m < 12) return `${Math.round(m)}개월`;
  const y = Math.floor(m / 12);
  const r = Math.round(m % 12);
  return r > 0 ? `${y}년 ${r}개월` : `${y}년`;
}

function fmtNum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function sortChannels(items: ChannelResult[], sort: SortMode): ChannelResult[] {
  const list = [...items];
  if (sort === "trending")
    return list.sort((a, b) =>
      b.viewCount / Math.max(b.subscriberCount, 1) - a.viewCount / Math.max(a.subscriberCount, 1)
    );
  if (sort === "growth")
    return list.sort((a, b) =>
      b.subscriberCount / channelAgeMonths(b.publishedAt) -
      a.subscriberCount / channelAgeMonths(a.publishedAt)
    );
  if (sort === "new") {
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
          { icon: "🔥", label: "최근 조회수 높은 채널", desc: "구독자 대비 총 조회수 비율이 높은 채널. 콘텐츠 하나하나가 바이럴되는 채널을 찾아보세요." },
          { icon: "📈", label: "구독자 급상승", desc: "채널 나이 대비 구독자를 빠르게 모은 채널. 월 평균 구독자 증가량이 많은 순서로 보여드려요." },
          { icon: "🌱", label: "신생 고성장", desc: "최근 3년 이내 개설됐지만 영상당 조회수가 높은 채널. 막 시작한 분야에서 답을 찾아보세요." },
        ].map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-3xl mb-3">{c.icon}</div>
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

  if (!planData.canChannelSearch) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">📺</div>
          <h1 className="text-2xl font-bold">채널 찾기</h1>
          <p className="text-gray-400 text-sm">Starter 플랜부터 사용 가능한 기능입니다.</p>
          <Link href="/pricing" className="inline-block bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
            플랜 업그레이드 →
          </Link>
        </div>
      </main>
    );
  }

  const query = searchParams.q?.trim() || "";
  const rawSort = searchParams.sort ?? "trending";
  const sort: SortMode = (["trending", "growth", "new"] as SortMode[]).includes(rawSort as SortMode)
    ? (rawSort as SortMode)
    : "trending";

  let channels: ChannelResult[] = [];
  let apiError: string | null = null;

  if (query) {
    const result = await searchChannels(query, plan !== "free");
    if (result.error === "quota_exceeded") {
      apiError = "YouTube API 일일 쿼터가 소진됐습니다. 잠시 후 다시 시도해주세요.";
    } else if (result.error === "api_error") {
      apiError = "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    } else {
      channels = sortChannels(result.items, sort);
    }
  }

  // 컬럼 레이블
  const metricLabel: Record<SortMode, string> = {
    trending: "영상당 평균 조회",
    growth: "월 구독자 증가",
    new: "영상당 평균 조회",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 상단 검색 + 필터 */}
      <div className="border-b border-gray-800 bg-gray-900/50 px-4 py-4">
        <div className="max-w-screen-xl mx-auto space-y-3">
          <ChannelSearchBar initialQuery={query} />
          <div className="flex items-center gap-3 flex-wrap">
            <FilterTabs current={sort} query={query} />
            {query && channels.length > 0 && (
              <span className="text-xs text-gray-600 hidden md:block">
                {sort === "trending" && "영상당 평균 조회수 기준"}
                {sort === "growth" && "채널 나이 대비 월 평균 구독자 증가량 기준"}
                {sort === "new" && "3년 이내 개설 채널 우선 · 영상당 평균 조회수 기준"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 에러 */}
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
                    채널 나이
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
                        <a
                          href={`https://youtube.com/channel/${ch.channelId}`}
                          target="_blank"
                          rel="noopener noreferrer"
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
                        </a>
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

                      {/* 채널 나이 */}
                      <td className="px-4 py-4 text-right whitespace-nowrap hidden md:table-cell align-middle">
                        <span className={`text-xs ${isNew ? "text-green-400" : "text-gray-500"}`}>
                          {formatAge(ch.publishedAt)}
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
