import Image from "next/image";
import { formatDateYYYYMMDotDD, formatKoreanNumber } from "@/lib/format";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type VideoCardModel = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  subscriberCount: string;
  publishedAt: string;
  viewCount: number;
  viewCountFormatted?: string;
  score: "Good" | "Normal" | "Bad";
  sparkline: number[];
};

function Badge({ value }: { value: VideoCardModel["score"] }) {
  const color =
    value === "Good"
      ? "bg-emerald-600 text-white"
      : value === "Normal"
        ? "bg-amber-500 text-black"
        : "bg-rose-500 text-white";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {value}
    </span>
  );
}

export function VideoCard({ video }: { video: VideoCardModel }) {
  const sparkData = video.sparkline.map((v, idx) => ({ idx, value: v }));

  return (
    <div className="grid grid-cols-[120px_3fr_0.6fr_1fr_1.2fr] items-center gap-4 py-3 text-sm last:border-b-0">
      {/* 썸네일 */}
      <div className="relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-md bg-white/5">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
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
        {video.viewCountFormatted
          ? video.viewCountFormatted
          : `${formatKoreanNumber(video.viewCount)}회`}
      </div>

      {/* 채널 정보 */}
      <div className="shrink-0 text-right text-white/70">
        {video.channelTitle}
        {video.subscriberCount ? (
          <span className="ml-1 text-xs text-white/60">
            (구독자 {video.subscriberCount})
          </span>
        ) : null}
      </div>

      {/* 추세 그래프 + 배지 */}
      <div className="relative flex shrink-0 items-center justify-end gap-2">
        <div className="w-32 h-10 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <XAxis dataKey="idx" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "rgba(15,22,35,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 11,
                }}
                formatter={(value: unknown) =>
                  typeof value === "number"
                    ? Math.round(value).toLocaleString("ko-KR")
                    : String(value)
                }
                labelFormatter={(label: unknown) =>
                  typeof label === "number" ? `Day ${label}` : String(label)
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Badge value={video.score} />
      </div>
    </div>
  );
}
