"use client";
// next/image 대신 <img> 사용 — Vercel Image Optimization 비용 절감
// YouTube 썸네일은 YouTube CDN이 이미 최적화해서 제공하므로 재최적화 불필요
import { useState } from "react";
import { Video } from "@/types";
import ViewTrendGraph from "./ViewTrendGraph";

interface Props {
  video: Video;
  checked: boolean;
  onCheck: () => void;
  onClick: () => void;
  canAlgorithm: boolean;
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
      <span className={`text-sm font-bold ${color}`}>{label}</span>
      <div className="w-14 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ─── 잠금 뱃지 (프리 플랜) ──────────────────────────────────────────────────
function LockedAlgorithmBadge({
  onClickLock,
}: {
  score: number;
  onClickLock: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClickLock(); }}
      className="group flex flex-col items-center gap-1 cursor-pointer"
      title="Starter 플랜 이상에서 확인 가능"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </button>
  );
}

// ─── 업그레이드 유도 모달 ─────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#161b27] border border-gray-700 rounded-2xl p-7 w-[340px] space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 아이콘 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl">🔥</div>
          <h2 className="text-white text-base font-bold leading-snug">
            알고리즘 탑승 확률
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            지금 이 영상이 알고리즘을 타고<br />
            조회수가 폭발할 확률을 분석해 드려요.
          </p>
        </div>

        {/* 예시 뱃지 미리보기 */}
        <div className="flex justify-center gap-4">
          {[{ label: "🔥 78%", color: "text-orange-400" }, { label: "⚡ 55%", color: "text-yellow-400" }, { label: "32%", color: "text-teal-400" }].map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs font-bold ${b.color}`}>{b.label}</span>
              <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    b.color.includes("orange") ? "bg-orange-500"
                    : b.color.includes("yellow") ? "bg-yellow-500"
                    : "bg-teal-500"
                  }`}
                  style={{ width: b.label.includes("78") ? "78%" : b.label.includes("55") ? "55%" : "32%" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 플랜 안내 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1.5">
          <p className="flex items-center gap-2">
            <span className="text-teal-400 font-semibold">Starter</span>
            <span>이상부터 알고리즘 탑승 확률 확인</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-purple-400 font-semibold">Pro</span>
            <span>+ 수집한 영상 저장 · CSV 내보내기</span>
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-2">
          <a
            href="/pricing"
            className="block w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold text-center transition"
          >
            플랜 업그레이드 →
          </a>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

export default function VideoCard({ video, checked, onCheck, onClick, canAlgorithm }: Props) {
  const isShorts = (video.durationSeconds ?? 9999) <= 180;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* ───── 데스크탑 레이아웃 ───── */}
      <div
        className={`hidden md:grid items-center gap-2 px-3 py-4 transition-colors group ${
          checked ? "bg-teal-950/20" : "hover:bg-gray-900/60"
        }`}
        style={{ gridTemplateColumns: "32px 40px 130px 1fr 90px 155px 85px 95px 95px" }}
      >
        {/* 체크박스 */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={checked} onChange={onCheck} className="w-3.5 h-3.5 accent-teal-500 cursor-pointer" />
        </div>

        {/* CC */}
        <div className="flex justify-center">
          {isShorts ? (
            <span className="text-[11px] font-bold text-red-400 bg-red-950/50 border border-red-900 px-1.5 py-0.5 rounded">S</span>
          ) : (
            <span className="text-[11px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900 px-1.5 py-0.5 rounded">L</span>
          )}
        </div>

        {/* 썸네일 */}
        <div className="relative aspect-video rounded-md overflow-hidden cursor-pointer border border-gray-800 group-hover:border-gray-600 transition-colors shrink-0" onClick={onClick}>
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
          {video.duration && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 py-0.5 rounded">
              {video.duration}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div className="min-w-0 flex flex-col justify-center pl-1">
          <h3 className="text-base text-gray-200 line-clamp-2 leading-snug group-hover:text-teal-400 transition-colors cursor-pointer" onClick={onClick}>
            {video.title}
          </h3>
        </div>

        {/* 조회수 */}
        <div className="text-center">
          <div className="text-base font-bold text-white">{video.viewCountFormatted}</div>
        </div>

        {/* 채널 */}
        <div className="flex flex-col items-center justify-center text-center gap-1">
          {video.channelThumbnail && (
            <img src={video.channelThumbnail} alt="" className="w-8 h-8 rounded-full border border-gray-700" />
          )}
          <span className="text-xs text-gray-300 truncate max-w-[130px] leading-none">{video.channelTitle}</span>
          <span className="text-[11px] text-gray-500">{video.subscriberCount}명</span>
        </div>

        {/* 아웃라이어 */}
        <div className="text-center">
          <span className={`text-base font-bold ${video.performanceColor}`}>{video.performanceRatio}</span>
        </div>

        {/* 알고리즘 확률 — 항상 컬럼 렌더링, 플랜에 따라 내용 다름 */}
        <div className="flex justify-center">
          {canAlgorithm ? (
            <AlgorithmBadge score={video.algorithmScore} />
          ) : (
            <LockedAlgorithmBadge
              score={video.algorithmScore}
              onClickLock={() => setShowUpgradeModal(true)}
            />
          )}
        </div>

        {/* 게시일 */}
        <div className="text-center">
          <div className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-md border border-gray-800 whitespace-nowrap">
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
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
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
            {canAlgorithm ? (
              <AlgorithmBadge score={video.algorithmScore} />
            ) : (
              <LockedAlgorithmBadge
                score={video.algorithmScore}
                onClickLock={() => setShowUpgradeModal(true)}
              />
            )}
          </div>

          {/* 게시일 */}
          <span className="text-[10px] text-gray-600">{video.publishedAt}</span>
        </div>
      </div>
    </>
  );
}
