import Image from "next/image";
import { formatDateYYYYMMDotDD, formatSubscribers, formatKoreanNumber } from "@/lib/format";
import type { PerformanceBadge as BadgeType, SparkPoint } from "@/lib/youtube";
import { PerformanceBadge } from "./PerformanceBadge";
import { Sparkline } from "./Sparkline";

export type VideoCardModel = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  subscriberCount: number;
  publishedAt: string;
  viewCount: number; // 조회수 추가
  badge: BadgeType;
  spark: SparkPoint[];
};

export function VideoCard({ video }: { video: VideoCardModel }) {
  return (
    <div
      className="grid items-center py-3 text-sm last:border-b-0"
      style={{
        gridTemplateColumns: "128px 1fr 100px 180px 200px",
      }}
    >
      {/* 썸네일 */}
      <div className="relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-md bg-white/5">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : null}
      </div>

      {/* 제목 */}
      <div className="min-w-0 pr-4">
        <div className="line-clamp-2 font-medium text-white">
          {video.title}
        </div>
        <div className="mt-1 text-xs text-white/60">
          {formatDateYYYYMMDotDD(video.publishedAt)}
        </div>
      </div>

      {/* 조회수 */}
      <div className="shrink-0 text-right text-white/70">
        {formatKoreanNumber(video.viewCount)}회
      </div>

      {/* 채널 정보 */}
      <div className="shrink-0 text-right text-white/70">
        {video.channelTitle} ({formatSubscribers(video.subscriberCount)})
      </div>

      {/* 추세 그래프 + 배지 */}
      <div className="relative flex shrink-0 items-center justify-end gap-2">
        <Sparkline data={video.spark} />
        <PerformanceBadge value={video.badge} />
        <div className="absolute -bottom-4 right-0 text-[11px] text-white/40">
          누적 조회수 추이 (게시일~현재)
        </div>
      </div>
    </div>
  );
}

