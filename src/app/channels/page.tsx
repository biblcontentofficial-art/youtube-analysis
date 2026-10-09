import { currentUser } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { OG_DEFAULT } from "@/lib/seo";
import { searchChannels, ChannelResult } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "유튜브 채널 찾기 · 성장 채널 발견",
  description:
    "비블랩 채널 찾기. 주제·분야 키워드로 구독자 급상승·신생 고성장 유튜브 채널을 발굴하세요. 협업 채널, 벤치마킹 채널을 빠르게 찾습니다.",
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
import ToolTabs from "../_components/ToolTabs";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClass } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";

interface Props {
  searchParams: { q?: string; sort?: string; dateOrder?: string };
}

// ─── 빈 상태 (정렬 설명 한 벌) ─────────────────────────────────────────────────

const SORT_GUIDE = [
  {
    label: "영상 평균 조회수 순",
    desc: "채널 전체 영상의 영상당 평균 조회수가 높은 순으로 정렬합니다. 콘텐츠 하나하나가 잘 터지는 채널을 찾아보세요.",
  },
  {
    label: "월 구독자 증가량 순",
    desc: "구독자 수 ÷ 채널 개설 월수로 계산한 월평균 구독자 증가량이 많은 순으로 정렬합니다.",
  },
  {
    label: "신생 채널 · 평균 조회수 순",
    desc: "개설 3년 이내 채널을 우선으로, 영상당 평균 조회수 높은 순으로 정렬합니다.",
  },
];

function EmptyState() {
  return (
    <section aria-labelledby="sort-guide-title" className="rounded-panel border border-line bg-surface">
      <div className="flex h-11 items-center border-b border-line-soft px-5 md:px-6">
        <h2 id="sort-guide-title" className="text-body-sm font-semibold text-fg">정렬 기준</h2>
      </div>
      <ol className="grid divide-y divide-line-soft md:grid-cols-3 md:divide-x md:divide-y-0">
        {SORT_GUIDE.map((c, i) => (
          <li key={c.label} className="px-5 py-4 md:px-6 md:py-5">
            <p className="tnum text-body-sm font-bold text-silver">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-1 text-ui font-semibold text-fg">{c.label}</p>
            <p className="mt-1 text-body-sm text-fg-3">{c.desc}</p>
          </li>
        ))}
      </ol>
    </section>
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

  const usageText = isOut
    ? usage.isDaily ? "오늘 채널 검색 한도 초과" : "이번 달 채널 검색 한도 초과"
    : `채널 검색 ${remaining}회 남음`;
  const usageTone = isOut ? "text-negative" : isLow ? "text-caution" : "text-fg-3";

  // 상태 메시지 상자 (DESIGN 6.13)
  const STATUS_BOX = "mb-6 flex gap-3 rounded-card border bg-surface p-4 break-keep";

  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* 앱 셸: 도구 탭 → 머리 → 검색 (DESIGN 7.2 · 7.3 채널 찾기) */}
      <ToolTabs current="/channels" />

      <div className="mx-auto w-full max-w-wide px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="CHANNELS" className="mb-6! md:mb-8!" />
        <h1 className="text-h3 text-fg">채널 찾기</h1>
        <p className="mt-2 text-body-sm text-fg-3 md:text-ui">
          분야 키워드를 검색하면 그 분야에서 성장 중인 채널을 한눈에 비교할 수 있어요
        </p>

        <section aria-label="검색" className="mt-5 lg:mt-6">
          <ChannelSearchBar
            initialQuery={query}
            hint={
              // 남은 횟수: 평소 fg-3 · 5회 이하 caution · 0회 negative (무제한이면 생략)
              remaining === null ? null : (
                <p className="-mt-0.5 text-caption sm:mt-0">
                  <Link
                    href="/pricing"
                    title={usage.isDaily ? "오늘 채널 검색 가능 횟수" : "이번 달 채널 검색 가능 횟수"}
                    className={`tnum inline-flex min-h-6 items-center underline-offset-2 transition-colors hover:underline ${usageTone}`}
                  >
                    {usageText}
                  </Link>
                </p>
              )
            }
          />
        </section>

        {/* 정렬 탭 + 개설일 토글 + 정렬 기준 한 줄 */}
        <div className="mt-6 flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-3">
          <FilterTabs query={query} />
          {/* 신생 고성장 탭 전용: 채널 개설일 정렬 토글 (다른 탭에서는 그리지 않음) */}
          <DateSortToggle query={query} />
          {query && channels.length > 0 && <ChannelSortCaption />}
        </div>

        <div className="mt-6">
          {/* 한도 초과 */}
          {limitError === "limit_exceeded" && (
            <div role="alert" className={`${STATUS_BOX} border-negative/55`}>
              <WarningIcon className="mt-0.5 text-negative" />
              <div className="min-w-0">
                <p className="text-ui font-semibold text-negative">{usage.isDaily ? "오늘 채널 검색 횟수를 모두 사용했어요" : "이번 달 채널 검색 횟수를 모두 사용했어요"}</p>
                <p className="mt-1 text-body-sm text-fg-3">
                  현재 플랜: <span className="font-medium text-fg-1">{usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)}</span>
                  {" · "}사용: <span className="tnum font-medium text-fg-1">{usage.used}/{usage.limit}회</span>
                </p>
                {/* 일 한도 키는 UTC 날짜라(channelLimit) 한국 시간 오전 9시에 초기화된다. /search 안내(limitCopy)와 같은 표현. */}
                <p className="mt-1 text-body-sm text-fg-3">{usage.isDaily ? "매일 오전 9시(한국 시간)에 횟수가 초기화되거나, 플랜을 업그레이드하면 더 많이 사용할 수 있어요." : "다음 달 1일에 횟수가 초기화되거나, 플랜을 업그레이드하면 더 많이 사용할 수 있어요."}</p>
                {/* 흰 면은 검색 버튼 하나라 보조 버튼 */}
                <Link href="/pricing" className={`mt-3 ${buttonClass({ variant: "secondary", size: "sm" })}`}>
                  플랜 업그레이드 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* API 에러 */}
          {apiError && (
            <div role="alert" className={`${STATUS_BOX} border-negative/55`}>
              <WarningIcon className="mt-0.5 text-negative" />
              <p className="text-ui font-semibold text-negative">{apiError}</p>
            </div>
          )}

          {/* 빈 상태 */}
          {!query && <EmptyState />}

          {/* 결과 없음 (한도 초과로 검색하지 않은 경우는 위 한도 안내만 보인다) */}
          {query && !apiError && !limitError && channels.length === 0 && (
            <div className="flex flex-col items-start gap-1 rounded-card border border-line bg-surface p-6 md:p-8">
              <p className="text-ui font-semibold text-fg">검색 결과가 없어요</p>
              <p className="text-body-sm text-fg-3">다른 키워드로 검색해보세요</p>
            </div>
          )}

          {/* 신생 고성장 안내 + 결과 표 (정렬은 브라우저에서) */}
          <ChannelResults channels={channels} query={query} now={now} />
        </div>
      </div>
    </main>
  );
}
