import Image from "next/image";
import { Video } from "@/types";

interface Props {
  video: Video;
  checked: boolean;
  onCheck: () => void;
  onClick: () => void;
}

function ScoreBadge({ score }: { score: "Good" | "Normal" | "Bad" }) {
  const styles = {
    Good: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
    Normal: "text-gray-400 bg-gray-800/60 border-gray-700",
    Bad: "text-red-400 bg-red-950/60 border-red-900",
  };
  const dots = { Good: 4, Normal: 3, Bad: 2 };
  return (
    <div className={`inline-flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold gap-0.5 ${styles[score]}`}>
      <div className="flex gap-0.5">
        {Array.from({ length: dots[score] }).map((_, i) => (
          <span key={i} className="w-1 h-1 rounded-full bg-current" />
        ))}
      </div>
      <span>{score}</span>
    </div>
  );
}

function AlgorithmBadge({ score }: { score: number }) {
  let color: string;
  let label: string;
  let barColor: string;

  if (score >= 70) {
    color = "text-orange-400";
    label = "🔥 " + score + "%";
    barColor = "bg-orange-500";
  } else if (score >= 50) {
    color = "text-yellow-400";
    label = "⚡ " + score + "%";
    barColor = "bg-yellow-500";
  } else if (score >= 30) {
    color = "text-teal-400";
    label = score + "%";
    barColor = "bg-teal-500";
  } else {
    color = "text-gray-500";
    label = score + "%";
    barColor = "bg-gray-600";
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xs font-bold ${color}`}>{label}</span>
      <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function VideoCard({ video, checked, onCheck, onClick }: Props) {
  const isShorts = (video.durationSeconds ?? 9999) <= 180;

  return (
    <>
      {/* ───── 데스크탑 레이아웃 ───── */}
      <div
        className={`hidden md:grid items-center gap-2 px-3 py-3 transition-colors group ${
          checked ? "bg-teal-950/20" : "hover:bg-gray-900/60"
        }`}
        style={{ gridTemplateColumns: "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px" }}
      >
        {/* 체크박스 */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={checked} onChange={onCheck} className="w-3.5 h-3.5 accent-teal-500 cursor-pointer" />
        </div>

        {/* CC */}
        <div className="flex justify-center">
          {isShorts ? (
            <span className="text-[9px] font-bold text-red-400 bg-red-950/50 border border-red-900 px-1.5 py-0.5 rounded">S</span>
          ) : (
            <span className="text-[9px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900 px-1.5 py-0.5 rounded">L</span>
          )}
        </div>

        {/* 썸네일 */}
        <div className="relative aspect-video rounded-md overflow-hidden cursor-pointer border border-gray-800 group-hover:border-gray-600 transition-colors shrink-0" onClick={onClick}>
          <Image src={video.thumbnail} alt={video.title} fill sizes="110px" className="object-cover" />
          {video.duration && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 py-0.5 rounded">
              {video.duration}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div className="min-w-0 flex flex-col justify-center pl-1">
          <h3 className="text-sm text-gray-200 line-clamp-2 leading-snug group-hover:text-teal-400 transition-colors cursor-pointer" onClick={onClick}>
            {video.title}
          </h3>
        </div>

        {/* 조회수 */}
        <div className="text-center">
          <div className="text-sm font-bold text-white">{video.viewCountFormatted}</div>
        </div>

        {/* 채널 */}
        <div className="flex flex-col items-center justify-center text-center gap-1">
          {video.channelThumbnail && (
            <img src={video.channelThumbnail} alt="" className="w-7 h-7 rounded-full border border-gray-700" />
          )}
          <span className="text-[11px] text-gray-300 truncate max-w-[120px] leading-none">{video.channelTitle}</span>
          <span className="text-[10px] text-gray-600">{video.subscriberCount}명</span>
        </div>

        {/* 아웃라이어 */}
        <div className="text-center">
          <span className={`text-sm font-bold ${video.performanceColor}`}>{video.performanceRatio}</span>
        </div>

        {/* 성과도 */}
        <div className="flex justify-center">
          <ScoreBadge score={video.score} />
        </div>

        {/* 알고리즘 확률 */}
        <div className="flex justify-center">
          <AlgorithmBadge score={video.algorithmScore} />
        </div>

        {/* 게시일 */}
        <div className="text-center">
          <div className="text-[11px] text-gray-500 bg-gray-900 px-2 py-1 rounded-md border border-gray-800 whitespace-nowrap">
            {video.publishedAt}
          </div>
        </div>
      </div>

      {/* ───── 모바일 카드 레이아웃 ───── */}
      <div
        className={`flex md:hidden gap-3 px-3 py-3 transition-colors ${
          checked ? "bg-teal-950/20" : "hover:bg-gray-900/60"
        }`}
      >
        {/* 체크박스 */}
        <div className="flex items-start pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={checked} onChange={onCheck} className="w-3.5 h-3.5 accent-teal-500 cursor-pointer" />
        </div>

        {/* 썸네일 */}
        <div className="relative w-28 aspect-video rounded-lg overflow-hidden cursor-pointer shrink-0 border border-gray-800" onClick={onClick}>
          <Image src={video.thumbnail} alt={video.title} fill sizes="112px" className="object-cover" />
          {video.duration && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 py-0.5 rounded">
              {video.duration}
            </div>
          )}
          <div className="absolute top-1 left-1">
            {isShorts ? (
              <span className="text-[8px] font-bold text-red-400 bg-black/70 px-1 py-0.5 rounded">S</span>
            ) : (
              <span className="text-[8px] font-bold text-blue-400 bg-black/70 px-1 py-0.5 rounded">L</span>
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* 제목 */}
          <h3 className="text-sm text-gray-200 line-clamp-2 leading-snug cursor-pointer hover:text-teal-400" onClick={onClick}>
            {video.title}
          </h3>

          {/* 채널 */}
          <div className="flex items-center gap-1.5">
            {video.channelThumbnail && (
              <img src={video.channelThumbnail} alt="" className="w-4 h-4 rounded-full" />
            )}
            <span className="text-[11px] text-gray-500 truncate">{video.channelTitle}</span>
          </div>

          {/* 지표 */}
          <div className="flex items-center flex-wrap gap-2 mt-0.5">
            <span className="text-xs font-bold text-white">{video.viewCountFormatted}</span>
            <span className={`text-xs font-bold ${video.performanceColor}`}>{video.performanceRatio}</span>
            <ScoreBadge score={video.score} />
            <AlgorithmBadge score={video.algorithmScore} />
          </div>

          {/* 게시일 */}
          <span className="text-[10px] text-gray-600">{video.publishedAt}</span>
        </div>
      </div>
    </>
  );
}
