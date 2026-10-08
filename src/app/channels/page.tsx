import { currentUser } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { OG_DEFAULT } from "@/lib/seo";
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
    ...OG_DEFAULT,
    title: "유튜브 채널 찾기 · 성장 채널 발견 | 비블랩",
    description: "키워드로 구독자 급상승·신생 채널을 찾아보세요.",
    url: "https://bibllab.com/channels",
  },
};
import { PLANS, PlanKey } from "@/lib/stripe";
import { getChannelUsage, incrementChannelCount } from "@/lib/channelLimit";
import ChannelSearchBar from "./_components/ChannelSearchBar";
import FilterTabs from "./_components/FilterTabs";
import DateSortToggle from "./_components/DateSortToggle";
import ChannelResults, { ChannelSortCaption } from "./_components/ChannelResults";

interface Props {
  searchParams: { q?: string; sort?: string; dateOrder?: string };
}

// ─── 빈 상태 ─────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-20 px-4 max-w-2xl mx-auto">
      <p className="text-center text-neutral-500 text-sm mb-10">
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
          <div key={c.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="mb-3">{c.icon}</div>
            <p className="text-sm font-semibold text-white mb-2">{c.label}</p>
            <p className="text-xs text-neutral-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default async function ChannelsPage({ searchParams }: Props) {
  const user = await currentUser();
  const plan = (user?.plan as string) ?? "free";
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;

  const query = searchParams.q?.trim() || "";
  // 정렬(sort·dateOrder)은 서버가 읽지 않는다. ChannelResults 가 주소를 읽어 브라우저에서 줄 세운다.

  // 사용량 조회 (검색 전 항상 확인)
  const usage = await getChannelUsage();

  let channels: ChannelResult[] = [];
  let apiError: string | null = null;
  let limitError: string | null = null;
  // 남은 횟수 표시에 쓸 사용량. 이번 요청에서 차감했으면 증가 후 값(방금 쓴 1회 포함)으로 바꾼다.
  let usedForDisplay = usage.used;

  if (query) {
    if (!usage.unlimited && usage.used >= usage.limit) {
      // 한도 초과 — API 호출 없이 차단
      limitError = "limit_exceeded";
    } else {
      // 카운트 증가 후 검색
      const charged = await incrementChannelCount();
      // 비로그인 차감은 서버 컴포넌트에서 쿠키를 쓰지 못해 기록되지 않는다(channelLimit, 범위 밖).
      // 기록되지 않은 값으로 빼면 '한도 초과'로 잘못 보이므로 로그인 사용자만 증가 후 값을 쓴다.
      if (user) usedForDisplay = charged.used;
      const result = await searchChannels(query, plan !== "free");
      if (result.error === "quota_exceeded") {
        apiError = "YouTube API 일일 쿼터가 소진됐습니다. 잠시 후 다시 시도해주세요.";
      } else if (result.error === "api_error") {
        apiError = "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else {
        // 정렬하지 않고 받은 순서 그대로 넘긴다. 탭·토글은 브라우저에서 다시 줄 세운다(서버 재요청·재차감 없음).
        channels = result.items;
      }
    }
  }

  // 채널 나이 기준 시각. 서버 렌더와 하이드레이션이 같은 정렬·값을 내도록 한 번 정해 넘긴다.
  const now = Date.now();

  const remaining = usage.unlimited ? null : Math.max(0, usage.limit - usedForDisplay);
  const isLow = remaining !== null && remaining <= 5;
  const isOut = remaining !== null && remaining === 0;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* 상단 검색 + 필터 */}
      <div className="border-b border-neutral-800 px-4 py-4">
        <div className="max-w-screen-xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <ChannelSearchBar initialQuery={query} />
            {/* 사용량 뱃지 */}
            {usage.unlimited ? (
              <span className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-300 shrink-0">
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
                    : "border-neutral-700 bg-neutral-900 text-neutral-400"
                }`}
                title={usage.isDaily ? "오늘 채널 검색 가능 횟수" : "이번 달 채널 검색 가능 횟수"}
              >
                <span>{isOut ? "🚫" : isLow ? "⚠️" : "📺"}</span>
                <span>{isOut ? (usage.isDaily ? "오늘 한도 초과" : "이번 달 한도 초과") : `${remaining}회 남음`}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FilterTabs query={query} />

            {/* 신생 고성장 탭 전용: 채널 개설일 정렬 토글 (다른 탭에서는 그리지 않음) */}
            <DateSortToggle query={query} />

            {query && channels.length > 0 && <ChannelSortCaption />}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 한도 초과 */}
        {limitError === "limit_exceeded" && (
          <div className="mb-6 p-6 bg-neutral-900 border border-neutral-700 rounded-xl text-center space-y-3">
            <p className="text-2xl">🚫</p>
            <p className="text-white font-semibold">{usage.isDaily ? "오늘 채널 검색 횟수를 모두 사용했어요" : "이번 달 채널 검색 횟수를 모두 사용했어요"}</p>
            <p className="text-neutral-400 text-sm">
              현재 플랜: <span className="font-medium text-neutral-200">{usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)}</span>
              &nbsp;·&nbsp; 사용: <span className="font-medium text-neutral-200">{usage.used}/{usage.limit}회</span>
            </p>
            {/* 일 한도 키는 UTC 날짜라(channelLimit) 한국 시간 오전 9시에 초기화된다. /search 안내(limitCopy)와 같은 표현. */}
            <p className="text-neutral-500 text-xs">{usage.isDaily ? "매일 오전 9시(한국 시간)에 횟수가 초기화되거나, 플랜을 업그레이드하면 더 많이 사용할 수 있어요." : "다음 달 1일에 횟수가 초기화되거나, 플랜을 업그레이드하면 더 많이 사용할 수 있어요."}</p>
            <Link
              href="/pricing"
              className="inline-block mt-2 bg-white hover:bg-neutral-200 text-black text-sm font-bold px-6 py-2.5 rounded-lg transition"
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

        {/* 결과 없음 (한도 초과로 검색하지 않은 경우는 위 한도 카드만 보인다) */}
        {query && !apiError && !limitError && channels.length === 0 && (
          <div className="p-12 text-center border border-neutral-800 rounded-xl bg-neutral-900/50">
            <p className="text-neutral-400">검색 결과가 없어요</p>
            <p className="text-neutral-500 text-sm mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {/* 신생 고성장 안내 + 결과 테이블 (정렬은 브라우저에서) */}
        <ChannelResults channels={channels} query={query} now={now} />
      </div>
    </main>
  );
}
