"use client";

/**
 * 내 Threads 계정 분석 대시보드.
 * 근거: DESIGN.md 7.3 스레드 · 6.6 세그먼트 · 6.7 앱 카드 · 6.13 상태 메시지 · 6.19 스켈레톤 · 3.1 히트맵(heat-1~5)
 *
 * - 기간 버튼 줄은 언제나 남긴다. 기간을 바꾸면 이전 데이터를 흐리게 둔 채(aria-busy) 새 데이터로 바꾼다. 화면 전체 스피너 없음.
 * - 오류는 서버의 임의 문자열을 그리지 않는다. 알려진 코드(META_NOT_CONNECTED · TOKEN_EXPIRED)만 한국어 문장, 그 밖은 고정 문장.
 *   상태 메시지(negative) + 흰 '다시 시도'(같은 기간) + 보조 '다시 연결하기'(/api/threads/auth).
 * - 숫자는 앞쪽 지표 6칸에 한 번만 보여 준다(예전 '프로필 개요' 카드의 같은 숫자 6개는 뺐다). 그 아래 3카드 = 연속 기록 · 인기 콘텐츠 · 콘텐츠 아이디어.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ProfileMetricCard from "./ProfileMetricCard";
import ProfileViewsChart from "./ProfileViewsChart";
import PostPerformanceTable from "./PostPerformanceTable";
import { buttonClass, cx } from "@/components/ui/button";
import { SEGMENT, SEGMENT_ITEM } from "@/components/ui/chip";
import { WarningIcon } from "@/components/ui/icons";
import { formatCompactKo } from "@/lib/format";

interface PostInsight {
  id: string;
  text: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  engagement_rate: number;
}

export interface InsightsData {
  profile: {
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count: number;
  };
  summary: {
    views: number;
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    followers_count: number;
  };
  daily_views: { date: string; value: number }[];
  posts: PostInsight[];
  period_posts_count: number;
  dashboard: {
    streak: number;
    last30: { date: string; count: number }[];
    topPosts: PostInsight[];
    topTopics: { topic: string; engagement: number; type: string }[];
  };
  averages: {
    total_posts: number;
    avg_views: number;
    avg_likes: number;
    avg_replies: number;
    avg_reposts: number;
    avg_quotes: number;
    avg_engagement_rate: number;
  };
}

/** 1만 이상은 만·억, 그 아래는 쉼표(소수 그대로) */
function num(n: number): string {
  return Math.abs(n) >= 10_000 ? formatCompactKo(n) : n.toLocaleString("ko-KR");
}

// ── 오류 코드 → 화면 문장 (서버 원문은 그리지 않는다) ──
type ErrorCode = "META_NOT_CONNECTED" | "TOKEN_EXPIRED" | "UNKNOWN";

const ERROR_TEXT: Record<ErrorCode, string> = {
  META_NOT_CONNECTED: "Threads 계정을 먼저 연결해주세요.",
  TOKEN_EXPIRED: "Threads 계정 연결이 만료됐어요. 다시 연결해주세요.",
  UNKNOWN: "Threads 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const PERIODS = [
  { label: "7일", value: 7 },
  { label: "1개월", value: 30 },
  { label: "6개월", value: 180 },
  { label: "1년", value: 365 },
];

const APP_CARD = "rounded-card border border-line bg-surface p-5 md:p-6";
const CARD_TITLE = "text-ui font-semibold text-fg";

// ── 응원/인정 멘트 ──
const CHEERS_HIGH = ["프로 스레더시네요!", "발행 장인이세요!", "압도적이에요!", "독보적 꾸준함!", "대단하세요!"];
const CHEERS_MID = ["꾸준히 잘하고 계세요!", "좋은 페이스예요!", "이 흐름 유지해요!", "잘 성장하고 계세요!", "멋진 루틴이에요!"];
const CHEERS_LOW = ["시작이 반이에요!", "한 걸음씩 가봐요!", "오늘 한 개 써볼까요?", "다시 시작해봐요!", "할 수 있으세요!"];

function getCheer(avg: number): string {
  const list = avg >= 2 ? CHEERS_HIGH : avg >= 0.5 ? CHEERS_MID : CHEERS_LOW;
  return list[Math.floor(Math.random() * list.length)];
}

/** 하루 게시 수 → 히트맵 단계(양만 있고 평가 없음, 무채색 heat-1~5) */
const HEAT_BG = ["bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4", "bg-heat-5"] as const;
function heatClass(count: number): string {
  return HEAT_BG[Math.min(Math.max(count, 0), 4)];
}

function StreakCard({ streak, last30 }: { streak: number; last30: { date: string; count: number }[] }) {
  const totalPosts = last30.reduce((s, d) => s + d.count, 0);
  const dailyAvg = Math.round(totalPosts / 30 * 10) / 10;
  // 다시 그릴 때마다 문구가 바뀌지 않게 평균이 바뀔 때만 고른다
  const cheer = useMemo(() => getCheer(dailyAvg), [dailyAvg]);
  const postedDays = last30.filter((d) => d.count > 0).length;

  return (
    <section aria-labelledby="threads-streak" className={APP_CARD}>
      <h2 id="threads-streak" className={CARD_TITLE}>게시 연속 기록</h2>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p>
          <span className="tnum text-h3 text-fg">{streak}</span>
          <span className="ml-1 text-body-sm text-fg-3">일 연속</span>
        </p>
        <p>
          <span className="tnum text-h4 font-extrabold text-fg">{dailyAvg}</span>
          <span className="ml-1 text-body-sm text-fg-3">개/일</span>
        </p>
      </div>
      <p className="mt-2 text-body-sm font-medium text-fg-2">{cheer}</p>
      <div
        role="img"
        aria-label={`최근 30일 중 ${postedDays}일 게시, 총 ${totalPosts}개`}
        className="mt-4 flex flex-wrap gap-1"
      >
        {last30.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count}개 게시`}
            className={cx("size-4 rounded-[3px]", heatClass(d.count))}
          />
        ))}
      </div>
      <p className="mt-2 text-caption text-fg-3">최근 30일</p>
    </section>
  );
}

function DashboardSkeleton() {
  const bone = "rounded-control bg-surface-2 animate-pulse motion-reduce:animate-none";
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">불러오는 중</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-surface p-4 md:p-5">
            <div className={cx(bone, "h-7 w-16")} />
            <div className={cx(bone, "mt-2 h-3 w-12")} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={APP_CARD}>
            <div className={cx(bone, "h-4 w-24")} />
            <div className={cx(bone, "mt-5 h-20 w-full")} />
          </div>
        ))}
      </div>
      <div className={APP_CARD}>
        <div className={cx(bone, "h-4 w-28")} />
        <div className={cx(bone, "mt-4 h-64 w-full")} />
      </div>
    </div>
  );
}

function ErrorState({ code, onRetry }: { code: ErrorCode; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-card border border-negative/55 bg-surface p-4 md:flex-row md:items-center md:p-5"
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <WarningIcon className="mt-0.5 text-negative" />
        <div className="min-w-0">
          <p className="text-ui font-semibold text-negative">불러오기 실패</p>
          <p className="mt-0.5 text-body-sm text-fg-3">{ERROR_TEXT[code]}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-8 max-md:pr-[76px] md:pl-0">
        <button type="button" onClick={onRetry} className={buttonClass()}>
          다시 시도
        </button>
        <a href="/api/threads/auth" className={buttonClass({ variant: "secondary" })}>
          다시 연결하기
        </a>
      </div>
    </div>
  );
}

export default function MyAccountDashboard() {
  const [period, setPeriod] = useState(7);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorCode | null>(null);
  // 기간을 빠르게 바꾸면 늦게 온 앞선 응답이 뒤의 응답을 덮지 않게 마지막 요청만 반영한다
  const reqSeq = useRef(0);

  const fetchData = useCallback(async (p: number) => {
    const seq = ++reqSeq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/threads/insights?period=${p}`);
      if (!res.ok) {
        let code: ErrorCode = "UNKNOWN";
        try {
          const body = await res.json();
          if (body?.error === "META_NOT_CONNECTED" || body?.error === "TOKEN_EXPIRED") code = body.error;
        } catch {
          // 본문이 JSON 이 아니면 고정 문장
        }
        if (seq === reqSeq.current) setError(code);
        return;
      }
      const json = (await res.json()) as InsightsData;
      if (seq === reqSeq.current) setData(json);
    } catch {
      if (seq === reqSeq.current) setError("UNKNOWN");
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  return (
    <div className="space-y-6">
      {/* ─── 기간 선택 (갱신 중에도 남긴다) ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="기간" className={SEGMENT}>
          {PERIODS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={period === opt.value}
              onClick={() => setPeriod(opt.value)}
              className={SEGMENT_ITEM}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* 라이브 영역은 늘 두고 글자만 바꾼다 */}
        <span role="status" className="text-caption text-fg-3">
          {loading && data ? "불러오는 중" : ""}
        </span>
      </div>

      {error ? (
        <ErrorState code={error} onRetry={() => fetchData(period)} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardBody data={data} busy={loading} />
      )}
    </div>
  );
}

function DashboardBody({ data, busy }: { data: InsightsData; busy: boolean }) {
  const { summary, daily_views, posts, averages, dashboard } = data;

  return (
    <div
      aria-busy={busy}
      className={cx("space-y-6 transition-opacity duration-150", busy && "pointer-events-none opacity-50")}
    >
      {/* ─── 지표 6칸 ─── */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-6">
        <ProfileMetricCard label="팔로워 수" value={summary.followers_count} />
        <ProfileMetricCard label="조회수" value={summary.views} />
        <ProfileMetricCard label="좋아요 수" value={summary.likes} />
        <ProfileMetricCard label="댓글 수" value={summary.replies} />
        <ProfileMetricCard label="리포스트 수" value={summary.reposts} />
        <ProfileMetricCard label="인용 수" value={summary.quotes} />
      </dl>

      {/* ─── 3카드: 연속 기록 · 인기 콘텐츠 · 콘텐츠 아이디어 ─── */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
        <StreakCard streak={dashboard.streak} last30={dashboard.last30} />

        <section aria-labelledby="threads-top-posts" className={APP_CARD}>
          <h2 id="threads-top-posts" className={CARD_TITLE}>인기 콘텐츠</h2>
          <div className="mt-3 space-y-1">
            {dashboard.topPosts.length === 0 && (
              <p className="text-body-sm text-fg-3">게시물이 없습니다</p>
            )}
            {dashboard.topPosts.map((p) => (
              <a
                key={p.id}
                href={p.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="-mx-2 block rounded-control p-2 transition-colors duration-150 hover:bg-surface-2"
              >
                <p className="line-clamp-2 text-body-sm text-fg-2">
                  {p.text.slice(0, 80) || "(미디어 게시물)"}
                </p>
                <p className="tnum mt-1 flex flex-wrap gap-x-3 text-caption text-fg-3">
                  <span>조회 {num(p.views)}</span>
                  <span>좋아요 {num(p.likes)}</span>
                  <span>댓글 {num(p.replies)}</span>
                </p>
                <span className="sr-only">(새 창)</span>
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="threads-ideas" className={APP_CARD}>
          <h2 id="threads-ideas" className={CARD_TITLE}>콘텐츠 아이디어</h2>
          {dashboard.topTopics.length === 0 ? (
            <p className="mt-3 text-body-sm text-fg-3">아직 데이터가 부족합니다</p>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-body-sm text-fg-3">
                반응이 좋았던 주제를 기반으로 비슷한 콘텐츠를 만들어보세요:
              </p>
              {dashboard.topTopics.map((t, i) => (
                <div key={i} className="rounded-control bg-surface-2 p-3">
                  <p className="line-clamp-2 text-body-sm text-fg-2">{t.topic}...</p>
                  <p className="tnum mt-1 text-caption text-fg-3">
                    반응 {num(t.engagement)} · 비슷한 주제로 작성 추천
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── 프로필 조회 변화 차트 ─── */}
      <ProfileViewsChart data={daily_views} />

      {/* ─── 평균 통계 ─── */}
      <section aria-labelledby="threads-averages" className={APP_CARD}>
        <h2 id="threads-averages" className={CARD_TITLE}>평균 통계</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          {[
            { label: "총 게시물 수", value: num(averages.total_posts) },
            { label: "평균 조회수", value: num(averages.avg_views) },
            { label: "평균 좋아요", value: num(averages.avg_likes) },
            { label: "평균 댓글", value: num(averages.avg_replies) },
            { label: "평균 리포스트", value: num(averages.avg_reposts) },
            { label: "평균 인용", value: num(averages.avg_quotes) },
            { label: "평균 참여율", value: `${averages.avg_engagement_rate}%` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-caption text-fg-3">{s.label}</dt>
              <dd className="tnum text-h4 font-extrabold text-fg">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─── 게시물 성과 테이블 ─── */}
      <PostPerformanceTable posts={posts} />
    </div>
  );
}
