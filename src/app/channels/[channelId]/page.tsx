import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getChannelDetail, getChannelRecentVideos } from "@/lib/youtube";
import { PLANS, PlanKey } from "@/lib/stripe";
import DescriptionToggle from "./_components/DescriptionToggle";

// ─── 유틸 함수 ────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000)      return `${Math.floor(n / 10_000)}만`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtViewFull(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}억 (${n.toLocaleString()})`;
  if (n >= 10_000)      return `${(n / 10_000).toFixed(1)}만 (${n.toLocaleString()})`;
  return n.toLocaleString();
}

function channelAgeMonths(publishedAt: string): number {
  if (!publishedAt) return 1;
  return Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function formatAge(publishedAt: string): string {
  if (!publishedAt) return "-";
  const months = Math.floor(channelAgeMonths(publishedAt));
  const years  = Math.floor(months / 12);
  const rem    = months % 12;
  if (years === 0) return `${months}개월`;
  if (rem === 0)   return `${years}년`;
  return `${years}년 ${rem}개월`;
}

function formatOpenDate(publishedAt: string): string {
  if (!publishedAt) return "-";
  const d = new Date(publishedAt);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const offset = 0x1f1e6 - 65;
  return Array.from(code.toUpperCase())
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
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
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1)   return "오늘";
  if (days < 7)   return `${days}일 전`;
  if (days < 30)  return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

// ─── 메타데이터 ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { channelId: string };
}): Promise<Metadata> {
  const { channel } = await getChannelDetail(params.channelId);
  if (!channel) return { title: "채널 정보 | 비블랩" };
  return {
    title: `${channel.title} · 채널 분석 | 비블랩`,
    description: `${channel.title} 채널의 구독자 수, 평균 조회수, 성장률 등 핵심 지표를 비블랩에서 확인하세요.`,
  };
}

// ─── 통계 카드 ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</span>
      {sub && <span className="text-xs text-gray-600 tabular-nums">{sub}</span>}
    </div>
  );
}

// ─── 성장 지표 칩 ─────────────────────────────────────────────────────────────

function MetricChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-500 flex items-center gap-1">
        <span>{icon}</span>
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

// ─── 영상 카드 ────────────────────────────────────────────────────────────────

function VideoCard({
  video,
}: {
  video: {
    videoId: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    durationSec: number;
  };
}) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition"
    >
      {/* 썸네일 */}
      <div className="relative aspect-video bg-gray-800">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
            ▶
          </div>
        )}
        {video.durationSec > 0 && (
          <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded">
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>
      {/* 정보 */}
      <div className="px-3 py-3 space-y-1.5">
        <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed group-hover:text-teal-300 transition">
          {video.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-[11px]">{relativeTime(video.publishedAt)}</span>
          <span className="text-gray-400 text-[11px] tabular-nums">
            조회 {fmtNum(video.viewCount)}
          </span>
        </div>
        {/* 좋아요 / 댓글 */}
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          <span>👍 {fmtNum(video.likeCount)}</span>
          <span>💬 {fmtNum(video.commentCount)}</span>
        </div>
      </div>
    </a>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

interface Props {
  params: { channelId: string };
  searchParams: { from?: string };
}

export default async function ChannelDetailPage({ params, searchParams }: Props) {
  const user = await currentUser();
  const plan = (user?.plan as string) ?? "free";
  const isPaid = plan !== "free";

  // 데이터 병렬 페치
  const [{ channel, error }, { videos }] = await Promise.all([
    getChannelDetail(params.channelId, isPaid),
    getChannelRecentVideos(params.channelId, isPaid),
  ]);

  if (!channel) {
    if (error === "not_found") notFound();
    // API 오류 — 빈 상태 표시
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-2xl">⚠️</p>
          <p className="text-white font-semibold">채널 정보를 불러오지 못했습니다</p>
          <p className="text-gray-500 text-sm">
            {error === "quota_exceeded"
              ? "YouTube API 일일 쿼터가 소진됐습니다. 잠시 후 다시 시도해주세요."
              : "일시적인 오류입니다. 잠시 후 다시 시도해주세요."}
          </p>
          <Link href="/channels" className="inline-block mt-3 text-teal-400 text-sm hover:underline">
            ← 채널 찾기로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  // ─── 파생 지표 계산 ────────────────────────────────────────────────────────
  const ageMonths       = channelAgeMonths(channel.publishedAt);
  const monthlySubGain  = Math.round(channel.subscriberCount / ageMonths);
  const uploadsPerMonth = channel.videoCount > 0
    ? (channel.videoCount / ageMonths).toFixed(1)
    : "0";
  const viewPerSub      = channel.subscriberCount > 0
    ? Math.round(channel.viewCount / channel.subscriberCount)
    : 0;

  // 구독자 급성장 여부 (월 평균 구독자 증가가 상위 기준)
  const growthLevel =
    monthlySubGain >= 50_000 ? { label: "🚀 급상승", color: "text-purple-400" }
    : monthlySubGain >= 10_000 ? { label: "📈 빠른 성장", color: "text-red-400" }
    : monthlySubGain >= 3_000  ? { label: "↑ 성장 중", color: "text-orange-400" }
    : { label: "→ 완만", color: "text-gray-400" };

  // 바이럴 지수 (총조회수 / 구독자)
  const viralLevel =
    viewPerSub >= 500 ? "text-purple-400"
    : viewPerSub >= 200 ? "text-red-400"
    : viewPerSub >= 80  ? "text-orange-400"
    : "text-gray-400";

  // 백 URL
  const backHref = searchParams.from
    ? decodeURIComponent(searchParams.from)
    : "/channels";

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ─── 배너 (있을 경우) ─────────────────────────────────────────────── */}
      {channel.bannerUrl && (
        <div className="w-full h-32 md:h-48 overflow-hidden">
          <img
            src={`${channel.bannerUrl}=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* ─── 뒤로가기 ──────────────────────────────────────────────────── */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition"
        >
          <span>←</span>
          <span>채널 찾기로 돌아가기</span>
        </Link>

        {/* ─── 채널 헤더 ─────────────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* 썸네일 */}
            <div className="shrink-0">
              {channel.thumbnail ? (
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-gray-700"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 flex items-center justify-center text-3xl ring-2 ring-gray-700">
                  📺
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{channel.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                    {channel.customUrl && <span>{channel.customUrl}</span>}
                    {channel.country && (
                      <span>
                        {countryFlag(channel.country)} {channel.country}
                      </span>
                    )}
                    {channel.publishedAt && (
                      <span>개설일 {formatOpenDate(channel.publishedAt)}</span>
                    )}
                  </div>
                </div>

                {/* YouTube 바로가기 버튼 */}
                <a
                  href={`https://www.youtube.com/channel/${channel.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube에서 보기
                </a>
              </div>

              {/* 토픽 태그 */}
              {channel.topicTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {channel.topicTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 구독자 수 (큼직하게) */}
              <p className="text-2xl font-bold text-teal-400 tabular-nums">
                {channel.subscriberCountFormatted}
                <span className="text-sm font-normal text-gray-500 ml-1">구독자</span>
              </p>
            </div>
          </div>
        </div>

        {/* ─── 핵심 통계 4개 ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="총 조회수"
            value={fmtNum(channel.viewCount)}
            sub={channel.viewCount.toLocaleString() + "회"}
          />
          <StatCard
            label="영상 수"
            value={channel.videoCount.toLocaleString() + "개"}
          />
          <StatCard
            label="영상당 평균 조회수"
            value={fmtNum(channel.avgViewsPerVideo)}
            sub={channel.avgViewsPerVideo.toLocaleString() + "회"}
            accent={
              channel.avgViewsPerVideo >= 500_000 ? "text-purple-400"
              : channel.avgViewsPerVideo >= 100_000 ? "text-red-400"
              : channel.avgViewsPerVideo >= 30_000 ? "text-orange-400"
              : "text-white"
            }
          />
          <StatCard
            label="채널 나이"
            value={formatAge(channel.publishedAt)}
            sub={formatOpenDate(channel.publishedAt) + " 개설"}
          />
        </div>

        {/* ─── 성장 지표 ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs text-gray-500 mb-2 px-0.5">성장 지표</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricChip
              icon="📈"
              label="월 평균 구독자 증가"
              value={`+${fmtNum(monthlySubGain)}/월`}
              color={growthLevel.color}
            />
            <MetricChip
              icon="🎯"
              label="성장 등급"
              value={growthLevel.label}
              color={growthLevel.color}
            />
            <MetricChip
              icon="📅"
              label="업로드 빈도"
              value={`${uploadsPerMonth}편/월`}
              color={
                parseFloat(uploadsPerMonth) >= 12 ? "text-teal-400"
                : parseFloat(uploadsPerMonth) >= 4 ? "text-green-400"
                : "text-gray-400"
              }
            />
            <MetricChip
              icon="🔥"
              label="조회수/구독자 비율"
              value={`${fmtNum(viewPerSub)}배`}
              color={viralLevel}
            />
          </div>
        </div>

        {/* ─── 채널 설명 ─────────────────────────────────────────────────── */}
        {channel.description && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
            <h2 className="text-xs text-gray-500">채널 소개</h2>
            <DescriptionToggle text={channel.description} />
          </div>
        )}

        {/* ─── 최근 영상 ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            최근 업로드 영상
            {videos.length > 0 && (
              <span className="text-xs text-gray-600 font-normal ml-2">{videos.length}개</span>
            )}
          </h2>

          {videos.length === 0 ? (
            <div className="p-8 text-center border border-gray-800 rounded-xl">
              <p className="text-gray-500 text-sm">최근 영상을 불러오지 못했습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {videos.map((v) => (
                <VideoCard key={v.videoId} video={v} />
              ))}
            </div>
          )}
        </div>

        {/* ─── 최근 영상 통계 요약 (있을 때) ────────────────────────────── */}
        {videos.length > 0 && (() => {
          const totalV   = videos.reduce((s, v) => s + v.viewCount, 0);
          const avgV     = Math.round(totalV / videos.length);
          const maxV     = Math.max(...videos.map((v) => v.viewCount));
          const maxVideo = videos.find((v) => v.viewCount === maxV)!;
          return (
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
              <h2 className="text-xs text-gray-500 mb-3">최근 영상 통계</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">평균 조회수</p>
                  <p className="text-lg font-bold text-white tabular-nums">{fmtNum(avgV)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">최고 조회수</p>
                  <p className="text-lg font-bold text-purple-400 tabular-nums">{fmtNum(maxV)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">최고 영상</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${maxVideo.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:underline line-clamp-2"
                  >
                    {maxVideo.title}
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
