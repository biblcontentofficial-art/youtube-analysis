/**
 * 채널 상세 화면(서버 컴포넌트, 데이터는 page.tsx 가 받아 넘긴다). 고정 데이터 미리보기도 이 부품을 그린다.
 * 순서(DESIGN 7.3): 헤더 → 핵심 수치 4개 → 성장 지표(범례·계산 근거) → 최근 영상 요약 → 영상 그리드 → 소개.
 * - 등급은 무채색 단계 + 등급 글자(grade.ts). '높음'을 빨강으로 쓰지 않는다. 급상승만 positive ▲.
 * - 유튜브로 나가는 링크는 보조 버튼 + ↗(.ext: 평소 fg-3, hover·포커스 때만 youtube).
 * - /my-channel 로 가는 링크를 두지 않는다(로그인·횟수 제한 없는 쿼터 소모 경로).
 */
import type { ChannelDetail, ChannelVideo } from "@/lib/youtube";
import { formatKstDate } from "@/lib/kst";
import { formatCompactKo } from "@/lib/format";
import { buttonClass, cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import DescriptionToggle from "./DescriptionToggle";
import BackToChannelsLink from "./BackToChannelsLink";
import ToolTabs from "../../../_components/ToolTabs";
import { GRADE_LABEL, GRADE_TONE, gradeLegend, gradeLevel, type GradeLevel } from "../../_components/grade";

// ─── 유틸 함수 ────────────────────────────────────────────────────────────────

function channelAgeMonths(publishedAt: string): number {
  if (!publishedAt) return 1;
  return Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function formatAge(publishedAt: string): string {
  if (!publishedAt) return "-";
  const months = Math.floor(channelAgeMonths(publishedAt));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months}개월`;
  if (rem === 0) return `${years}년`;
  return `${years}년 ${rem}개월`;
}

function formatOpenDate(publishedAt: string): string {
  if (!publishedAt) return "-";
  // 한국 시간 날짜. 채널 찾기 목록(브라우저에서 그림)과 같은 날짜를 보여 준다.
  return formatKstDate(publishedAt);
}

function formatDuration(sec: number): string {
  if (sec <= 0) return "";
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "오늘";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

/** 유튜브로 나가는 ↗ (DESIGN 6.15 .ext) */
function ExtIcon() {
  return (
    <svg className="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

const SECTION_TITLE = "text-body font-bold text-fg";
const CARD = "rounded-card border border-line bg-surface";

// ─── 통계 카드 ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className={cx(CARD, "flex flex-col gap-1 px-4 py-4 md:px-5")}>
      <dt className="text-caption text-fg-3">{label}</dt>
      <dd className="tnum text-h4 font-extrabold text-fg">{value}</dd>
      {sub && <dd className="tnum text-caption text-fg-3">{sub}</dd>}
    </div>
  );
}

/** 성장 지표 칸: 값 + 등급 글자(같은 무채색 단계) */
function MetricCell({
  label,
  value,
  grade,
  tone,
}: {
  label: string;
  value: string;
  grade: string;
  tone: string;
}) {
  return (
    <div className={cx(CARD, "flex flex-col gap-1 px-4 py-4 md:px-5")}>
      <dt className="text-caption text-fg-3">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-2">
        <span className={cx("tnum text-lead", tone)}>{value}</span>
        <span className={cx("text-caption", tone)}>{grade}</span>
      </dd>
    </div>
  );
}

// ─── 영상 카드 ────────────────────────────────────────────────────────────────

function VideoCard({ video }: { video: ChannelVideo }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(CARD, "group block overflow-hidden transition-colors duration-150 hover:border-line-hover")}
    >
      <div className="relative aspect-video bg-surface-2">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
        ) : null}
        {video.durationSec > 0 && (
          <span className="tnum absolute bottom-1.5 right-1.5 rounded bg-canvas/80 px-1.5 py-0.5 text-micro font-semibold text-fg">
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>
      <div className="space-y-1 px-3 py-3">
        <p className="line-clamp-2 text-body-sm font-medium text-fg-1">
          {video.title}
          <span className="sr-only"> (새 창)</span>
        </p>
        <p className="tnum flex flex-wrap items-center gap-x-1.5 text-micro text-fg-3">
          <span>{relativeTime(video.publishedAt)}</span>
          <span aria-hidden="true" className="text-fg-4">·</span>
          <span>조회 {formatCompactKo(video.viewCount)}</span>
        </p>
        <p className="tnum flex flex-wrap items-center gap-x-1.5 text-micro text-fg-3">
          <span>좋아요 {formatCompactKo(video.likeCount)}</span>
          <span aria-hidden="true" className="text-fg-4">·</span>
          <span>댓글 {formatCompactKo(video.commentCount)}</span>
        </p>
      </div>
    </a>
  );
}

// ─── 화면 ─────────────────────────────────────────────────────────────────────

/** 성장 등급(월 평균 구독자 증가 기준, 기존 단계·이름 그대로). 급상승만 positive ▲, 나머지는 무채색 단계 */
function growthGrade(monthlySubGain: number): { label: string; tone: string } {
  if (monthlySubGain >= 50_000) return { label: "▲ 급상승", tone: "font-bold text-positive" };
  if (monthlySubGain >= 10_000) return { label: "빠른 성장", tone: GRADE_TONE[1] };
  if (monthlySubGain >= 3_000) return { label: "성장 중", tone: GRADE_TONE[2] };
  return { label: "완만", tone: GRADE_TONE[3] };
}

/** 업로드 빈도 3단계(월 12편 이상 · 4편 이상 · 그 아래), 무채색 + 글자 */
function uploadGrade(perMonth: number): { label: string; level: GradeLevel } {
  if (perMonth >= 12) return { label: "많음", level: 0 };
  if (perMonth >= 4) return { label: "보통", level: 1 };
  return { label: "적음", level: 2 };
}

export default function ChannelDetailView({
  channel,
  videos,
  backHref,
}: {
  channel: ChannelDetail;
  videos: ChannelVideo[];
  backHref: string;
}) {
  // ─── 파생 지표 계산 ────────────────────────────────────────────────────────
  const ageMonths = channelAgeMonths(channel.publishedAt);
  const monthlySubGain = Math.round(channel.subscriberCount / ageMonths);
  const uploadsPerMonth = channel.videoCount > 0 ? (channel.videoCount / ageMonths).toFixed(1) : "0";
  const viewPerSub = channel.subscriberCount > 0 ? Math.round(channel.viewCount / channel.subscriberCount) : 0;

  const growth = growthGrade(monthlySubGain);
  const upload = uploadGrade(parseFloat(uploadsPerMonth));
  const viralLevel = gradeLevel("viewPerSubDetail", viewPerSub);
  const avgLevel = gradeLevel("avgViews", channel.avgViewsPerVideo);

  // 최근 영상 요약
  const summary =
    videos.length > 0
      ? (() => {
          const totalV = videos.reduce((s, v) => s + v.viewCount, 0);
          const maxV = Math.max(...videos.map((v) => v.viewCount));
          return {
            avgV: Math.round(totalV / videos.length),
            maxV,
            maxVideo: videos.find((v) => v.viewCount === maxV)!,
          };
        })()
      : null;

  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* 앱 셸: 도구 탭(현재 = 채널 찾기) */}
      <ToolTabs current="/channels" />

      {/* ─── 배너 (있을 경우, 콘텐츠 사진) ───────────────────────────────── */}
      {channel.bannerUrl && (
        <div className="h-28 w-full overflow-hidden bg-surface-2 md:h-44">
          <img
            src={`${channel.bannerUrl}=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`}
            alt=""
            className="size-full object-cover opacity-40"
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-wide px-6 pb-16 pt-2 lg:px-8 lg:pt-4">
        {/* ─── 뒤로가기 ──────────────────────────────────────────────────── */}
        <BackToChannelsLink href={backHref} />

        <div className="mt-3 space-y-8">

        {/* ─── 채널 헤더 ─────────────────────────────────────────────────── */}
        <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-start">
          {channel.thumbnail ? (
            <img src={channel.thumbnail} alt="" className="size-20 shrink-0 rounded-full bg-surface-2 object-cover sm:size-24" />
          ) : (
            <span aria-hidden="true" className="inline-flex size-20 shrink-0 items-center justify-center rounded-full bg-surface-3 text-h4 text-fg-2 sm:size-24">
              {channel.title.slice(0, 1)}
            </span>
          )}

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-h3 text-fg wrap-anywhere">{channel.title}</h1>
                {(channel.customUrl || channel.country) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-body-sm text-fg-3">
                    {channel.customUrl && <span>{channel.customUrl}</span>}
                    {channel.customUrl && channel.country && <span aria-hidden="true" className="text-fg-4">·</span>}
                    {channel.country && <span>{channel.country}</span>}
                  </p>
                )}
              </div>

              {/* YouTube 바로가기: 보조 버튼 + ↗ (빨간 면 금지, DESIGN 3.2 · 6.15) */}
              <a
                href={`https://www.youtube.com/channel/${channel.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                data-youtube-link
                className={buttonClass({ variant: "secondary", size: "md" })}
              >
                YouTube에서 보기
                <ExtIcon />
                <span className="sr-only">(새 창)</span>
              </a>
            </div>

            {channel.topicTags.length > 0 && (
              <ul aria-label="분야" className="flex flex-wrap gap-1.5">
                {channel.topicTags.map((tag) => (
                  <li key={tag} className={badgeClass()}>{tag}</li>
                ))}
              </ul>
            )}

            <p className="flex items-baseline gap-2">
              <span className="tnum text-[28px] font-extrabold leading-none tracking-[-0.03em] text-fg lg:text-[36px]">
                {channel.subscriberCountFormatted}
              </span>
              <span className="text-caption text-fg-3">구독자</span>
            </p>
          </div>
        </header>

        {/* ─── 핵심 수치 4개 ─────────────────────────────────────────────── */}
        <section aria-labelledby="stat-title">
          <h2 id="stat-title" className="sr-only">핵심 수치</h2>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="총 조회수"
              value={formatCompactKo(channel.viewCount)}
              sub={channel.viewCount.toLocaleString("ko-KR") + "회"}
            />
            <StatCard label="영상 수" value={channel.videoCount.toLocaleString("ko-KR") + "개"} />
            <StatCard
              label="영상당 평균 조회수"
              value={formatCompactKo(channel.avgViewsPerVideo)}
              sub={
                <>
                  {channel.avgViewsPerVideo.toLocaleString("ko-KR")}회 ·{" "}
                  <span className={GRADE_TONE[avgLevel]}>{GRADE_LABEL[avgLevel]}</span>
                </>
              }
            />
            <StatCard
              label="채널 나이"
              value={formatAge(channel.publishedAt)}
              sub={formatOpenDate(channel.publishedAt) + " 개설"}
            />
          </dl>
        </section>

        {/* ─── 성장 지표 ─────────────────────────────────────────────────── */}
        <section aria-labelledby="growth-title">
          <h2 id="growth-title" className={cx(SECTION_TITLE, "mb-3")}>성장 지표</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCell
              label="월 평균 구독자 증가"
              value={`+${formatCompactKo(monthlySubGain)}/월`}
              grade={growth.label}
              tone={growth.tone}
            />
            <MetricCell
              label="업로드 빈도"
              value={`${uploadsPerMonth}편/월`}
              grade={upload.label}
              tone={GRADE_TONE[upload.level]}
            />
            <MetricCell
              label="조회수/구독자 비율"
              value={`${formatCompactKo(viewPerSub)}배`}
              grade={GRADE_LABEL[viralLevel]}
              tone={GRADE_TONE[viralLevel]}
            />
          </dl>
          {/* 계산 근거 + 범례 (색만으로 말하지 않는다) */}
          <div className="mt-3 space-y-1 text-caption text-fg-3">
            <p>월 평균 구독자 증가: 구독자 수 ÷ 채널 개설 월수로 계산한 월평균 구독자 증가량</p>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-semibold text-fg-2">성장 등급</span>
              <span className="whitespace-nowrap"><span className="font-bold text-positive">▲ 급상승</span> 5만/월 이상</span>
              <span className="whitespace-nowrap"><span className={GRADE_TONE[1]}>빠른 성장</span> 1만/월 이상</span>
              <span className="whitespace-nowrap"><span className={GRADE_TONE[2]}>성장 중</span> 3천/월 이상</span>
              <span className="whitespace-nowrap"><span className={GRADE_TONE[3]}>완만</span> 그 아래</span>
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-semibold text-fg-2">업로드 빈도</span>
              <span className="whitespace-nowrap"><span className={GRADE_TONE[0]}>많음</span> 월 12편 이상</span>
              <span className="whitespace-nowrap"><span className={GRADE_TONE[1]}>보통</span> 월 4편 이상</span>
              <span className="whitespace-nowrap"><span className={GRADE_TONE[2]}>적음</span> 그 아래</span>
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-semibold text-fg-2">조회수/구독자 비율</span>
              {gradeLegend("viewPerSubDetail").map((g) => (
                <span key={g.level} className={cx("whitespace-nowrap", GRADE_TONE[g.level])}>{g.text}</span>
              ))}
            </p>
          </div>
        </section>

        {/* ─── 최근 영상 요약 ────────────────────────────────────────────── */}
        {summary && (
          <section aria-labelledby="recent-sum-title" className={cx(CARD, "p-5 md:p-6")}>
            <h2 id="recent-sum-title" className={cx(SECTION_TITLE, "mb-4")}>최근 영상 통계</h2>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-[1fr_1fr_2fr]">
              <div>
                <dt className="text-caption text-fg-3">평균 조회수</dt>
                <dd className="tnum text-lead font-bold text-fg">{formatCompactKo(summary.avgV)}</dd>
              </div>
              <div>
                <dt className="text-caption text-fg-3">최고 조회수</dt>
                <dd className="tnum text-lead font-bold text-fg">{formatCompactKo(summary.maxV)}</dd>
              </div>
              <div className="col-span-2 md:col-span-1">
                <dt className="text-caption text-fg-3">최고 영상</dt>
                <dd>
                  <a
                    href={`https://www.youtube.com/watch?v=${summary.maxVideo.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-3 text-body-sm font-medium text-fg underline decoration-fg-4 underline-offset-2 transition-colors hover:decoration-fg"
                  >
                    {summary.maxVideo.title} <ExtIcon />
                    <span className="sr-only">(새 창)</span>
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* ─── 최근 영상 그리드 ──────────────────────────────────────────── */}
        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className={cx(SECTION_TITLE, "mb-3")}>
            최근 업로드 영상
            {videos.length > 0 && <span className="tnum ml-2 text-caption font-normal text-fg-3">{videos.length}개</span>}
          </h2>

          {videos.length === 0 ? (
            <div className={cx(CARD, "p-6")}>
              <p className="text-body-sm text-fg-3">최근 영상을 불러오지 못했습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {videos.map((v) => (
                <VideoCard key={v.videoId} video={v} />
              ))}
            </div>
          )}
        </section>

        {/* ─── 채널 소개 ─────────────────────────────────────────────────── */}
        {channel.description && (
          <section aria-labelledby="desc-title" className={cx(CARD, "p-5 md:p-6")}>
            <h2 id="desc-title" className={cx(SECTION_TITLE, "mb-2")}>채널 소개</h2>
            <DescriptionToggle text={channel.description} />
          </section>
        )}
        </div>
      </div>
    </main>
  );
}
