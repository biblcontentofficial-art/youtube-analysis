import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { searchChannels, ChannelResult } from "@/lib/youtube";
import { PLANS, PlanKey } from "@/lib/stripe";
import ChannelSearchBar from "./_components/ChannelSearchBar";
import FilterTabs, { SortMode } from "./_components/FilterTabs";

interface Props {
  searchParams: { q?: string; sort?: string };
}

// ─── 정렬 유틸 ────────────────────────────────────────────────────────────────

function channelAgeMonths(publishedAt: string): number {
  if (!publishedAt) return 999;
  const created = new Date(publishedAt);
  const now = new Date();
  return Math.max(1, (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function formatAgeLabel(publishedAt: string): string {
  if (!publishedAt) return "-";
  const months = channelAgeMonths(publishedAt);
  if (months < 12) return `${Math.round(months)}개월`;
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  return rem > 0 ? `${years}년 ${rem}개월` : `${years}년`;
}

function sortChannels(items: ChannelResult[], sort: SortMode): ChannelResult[] {
  const cloned = [...items];

  if (sort === "trending") {
    // 구독자 대비 총 조회수 비율 (바이럴 계수) 내림차순
    return cloned.sort((a, b) => {
      const ra = a.viewCount / Math.max(a.subscriberCount, 1);
      const rb = b.viewCount / Math.max(b.subscriberCount, 1);
      return rb - ra;
    });
  }

  if (sort === "growth") {
    // 월 평균 구독자 증가량 (subscriberCount / 채널나이월) 내림차순
    return cloned.sort((a, b) => {
      const ra = a.subscriberCount / channelAgeMonths(a.publishedAt);
      const rb = b.subscriberCount / channelAgeMonths(b.publishedAt);
      return rb - ra;
    });
  }

  if (sort === "new") {
    // 채널 나이 3년(36개월) 이하인 채널만, 영상당 평균 조회수 내림차순
    const newChannels = cloned.filter((ch) => channelAgeMonths(ch.publishedAt) <= 36);
    const rest = cloned.filter((ch) => channelAgeMonths(ch.publishedAt) > 36);
    newChannels.sort((a, b) => b.avgViewsPerVideo - a.avgViewsPerVideo);
    rest.sort((a, b) => b.avgViewsPerVideo - a.avgViewsPerVideo);
    return [...newChannels, ...rest];
  }

  return cloned;
}

// ─── 지표 포맷 ─────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── 메트릭 뱃지 색상 ─────────────────────────────────────────────────────────

function viralColor(ratio: number) {
  if (ratio >= 200) return "text-purple-400 bg-purple-900/30 border-purple-700";
  if (ratio >= 80) return "text-red-400 bg-red-900/30 border-red-700";
  if (ratio >= 30) return "text-orange-400 bg-orange-900/30 border-orange-700";
  return "text-teal-400 bg-teal-900/30 border-teal-700";
}

function growthColor(spm: number) {
  if (spm >= 50000) return "text-purple-400 bg-purple-900/30 border-purple-700";
  if (spm >= 10000) return "text-red-400 bg-red-900/30 border-red-700";
  if (spm >= 3000) return "text-orange-400 bg-orange-900/30 border-orange-700";
  return "text-teal-400 bg-teal-900/30 border-teal-700";
}

function avgViewColor(avg: number) {
  if (avg >= 500000) return "text-purple-400 bg-purple-900/30 border-purple-700";
  if (avg >= 100000) return "text-red-400 bg-red-900/30 border-red-700";
  if (avg >= 30000) return "text-orange-400 bg-orange-900/30 border-orange-700";
  return "text-teal-400 bg-teal-900/30 border-teal-700";
}

// ─── 채널 카드 ────────────────────────────────────────────────────────────────

function ChannelCard({
  ch,
  rank,
  sort,
}: {
  ch: ChannelResult;
  rank: number;
  sort: SortMode;
}) {
  const ageMonths = channelAgeMonths(ch.publishedAt);
  const viralRatio = Math.round(ch.viewCount / Math.max(ch.subscriberCount, 1));
  const subsPerMonth = Math.round(ch.subscriberCount / Math.max(ageMonths, 1));
  const isNew = ageMonths <= 36;

  return (
    <a
      href={`https://youtube.com/channel/${ch.channelId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 hover:bg-gray-900/80 transition-all"
    >
      {/* 상단: 썸네일 + 이름 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative shrink-0">
          {ch.thumbnail ? (
            <img
              src={ch.thumbnail}
              alt={ch.title}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-700 group-hover:ring-teal-600 transition"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-2xl ring-2 ring-gray-700">
              📺
            </div>
          )}
          {/* 신생 뱃지 */}
          {isNew && (
            <span className="absolute -bottom-1 -right-1 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              NEW
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-mono shrink-0">#{rank}</span>
            <p className="text-sm font-semibold text-white truncate group-hover:text-teal-400 transition">
              {ch.title}
            </p>
          </div>
          {ch.customUrl && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{ch.customUrl}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            구독자 <span className="text-gray-300 font-medium">{ch.subscriberCountFormatted}</span>
            {ch.publishedAt && (
              <span className="ml-2">· {formatAgeLabel(ch.publishedAt)} 전 개설</span>
            )}
          </p>
        </div>
      </div>

      {/* 핵심 지표 (필터별 강조 메트릭) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {sort === "trending" && (
          <>
            <div className={`rounded-xl border px-3 py-2 ${viralColor(viralRatio)}`}>
              <p className="text-[10px] opacity-70 mb-0.5">바이럴 지수</p>
              <p className="text-sm font-bold">{fmtNum(viralRatio)}배</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2 text-gray-300">
              <p className="text-[10px] text-gray-500 mb-0.5">영상당 평균</p>
              <p className="text-sm font-bold">{fmtNum(ch.avgViewsPerVideo)}회</p>
            </div>
          </>
        )}

        {sort === "growth" && (
          <>
            <div className={`rounded-xl border px-3 py-2 ${growthColor(subsPerMonth)}`}>
              <p className="text-[10px] opacity-70 mb-0.5">월 평균 구독자↑</p>
              <p className="text-sm font-bold">+{fmtNum(subsPerMonth)}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2 text-gray-300">
              <p className="text-[10px] text-gray-500 mb-0.5">영상 수</p>
              <p className="text-sm font-bold">{ch.videoCount.toLocaleString()}개</p>
            </div>
          </>
        )}

        {sort === "new" && (
          <>
            <div className={`rounded-xl border px-3 py-2 ${avgViewColor(ch.avgViewsPerVideo)}`}>
              <p className="text-[10px] opacity-70 mb-0.5">영상당 평균 조회</p>
              <p className="text-sm font-bold">{fmtNum(ch.avgViewsPerVideo)}회</p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${isNew ? "text-green-400 bg-green-900/30 border-green-700" : "border-gray-700 bg-gray-800/50 text-gray-400"}`}>
              <p className="text-[10px] opacity-70 mb-0.5">채널 나이</p>
              <p className="text-sm font-bold">{formatAgeLabel(ch.publishedAt)}</p>
            </div>
          </>
        )}
      </div>

      {/* 설명 */}
      {ch.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-auto">
          {ch.description}
        </p>
      )}
    </a>
  );
}

// ─── 빈 상태 카드 ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="max-w-screen-md mx-auto px-4 py-16">
      <p className="text-center text-gray-500 text-sm mb-10">
        분야 키워드를 검색하면 그 분야에서 성장하고 있는 채널을 확인할 수 있어요
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "🔥",
            title: "요즘 뜨는 채널",
            desc: "구독자 대비 총 조회수 비율이 높은 채널.\n콘텐츠 하나하나가 바이럴 되는 채널을 찾아보세요.",
          },
          {
            icon: "📈",
            title: "구독자 급상승",
            desc: "채널 나이 대비 구독자를 빠르게 모은 채널.\n월 평균 구독자 증가량이 많은 순서로 보여드려요.",
          },
          {
            icon: "🌱",
            title: "신생 고성장",
            desc: "최근 3년 이내 개설됐지만 영상당 조회수가 높은 채널.\n이제 막 시작한 분야에서 답을 찾아보세요.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <p className="font-semibold text-white text-sm mb-2">{card.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────

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
  const rawSort = searchParams.sort ?? "trending";
  const sort: SortMode = ["trending", "growth", "new"].includes(rawSort)
    ? (rawSort as SortMode)
    : "trending";

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
      channels = sortChannels(result.items, sort);
    }
  }

  const sortLabel: Record<SortMode, string> = {
    trending: "바이럴 지수 (구독자 대비 조회수)",
    growth: "월 평균 구독자 증가량",
    new: "신생 채널 평균 조회수",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 검색 */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-4">
        <div className="max-w-screen-xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <ChannelSearchBar initialQuery={query} />
          </div>

          {/* 필터 탭 */}
          <div className="flex items-center gap-4 flex-wrap">
            <FilterTabs current={sort} query={query} />
            {query && channels.length > 0 && (
              <span className="text-xs text-gray-600">
                정렬 기준: {sortLabel[sort]}
              </span>
            )}
          </div>
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
        {!query && <EmptyState />}

        {/* 결과 없음 */}
        {query && !apiError && channels.length === 0 && (
          <div className="p-12 text-center border border-gray-800 rounded-xl bg-gray-900/50">
            <p className="text-gray-400">검색 결과가 없어요</p>
            <p className="text-gray-600 text-sm mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {/* 결과 그리드 */}
        {channels.length > 0 && (
          <>
            {/* 신생 고성장 필터: 3년 이하 채널 개수 안내 */}
            {sort === "new" && (() => {
              const newCount = channels.filter(
                (ch) => channelAgeMonths(ch.publishedAt) <= 36
              ).length;
              return newCount > 0 ? (
                <p className="text-xs text-green-500 mb-4">
                  🌱 3년 이내 개설된 신생 채널 {newCount}개가 상단에 표시됩니다
                </p>
              ) : (
                <p className="text-xs text-gray-500 mb-4">
                  이 키워드에서는 3년 이내 신생 채널이 없어요. 전체 채널을 평균 조회수 순으로 표시합니다.
                </p>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((ch, i) => (
                <ChannelCard key={ch.channelId} ch={ch} rank={i + 1} sort={sort} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
