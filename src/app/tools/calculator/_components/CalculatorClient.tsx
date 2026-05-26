"use client";

import { useState } from "react";
import { fetchVideoDetail, fetchChannelDetail } from "@/app/search/actions";

/**
 * 유튜브 비율 계산기 — 사용자 자가 도구
 *
 * YouTube ToS III.E.4h 준수 설계:
 * - 사용자가 명시적으로 URL 입력 + 계산 버튼 클릭해야만 동작
 * - bibl lab 서버는 YouTube API의 raw 데이터만 그대로 전달
 * - 모든 비율 계산은 클라이언트(브라우저)에서 단순 산술로 수행
 * - 결과에는 항상 "사용자 자가 계산, YouTube 공식 메트릭 아님" 디스클레이머 표시
 */

interface RawData {
  videoId: string;
  videoTitle: string;
  videoViews: number;
  videoLikes: number;
  channelTitle: string;
  channelSubscribers: number;
  channelTotalViews: number;
  channelVideoCount: number;
  channelAvgViews: number;
}

interface CalcResult {
  label: string;
  value: string;
  formula: string;
  note?: string;
}

// YouTube URL에서 videoId 추출
function extractVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // 그냥 ID만 입력
  ];
  for (const p of patterns) {
    const m = url.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

export default function CalculatorClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RawData | null>(null);
  const [results, setResults] = useState<CalcResult[]>([]);

  // ─── 1단계: URL → raw 데이터 가져오기 (사용자 클릭 시) ───
  async function handleFetch() {
    setError(null);
    setData(null);
    setResults([]);

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("올바른 YouTube 영상 URL이 아닙니다. 예: https://youtu.be/abc123XYZ12");
      return;
    }

    setLoading(true);
    try {
      // 서버에서 raw 데이터만 받아옴 (어떤 계산도 안 함)
      const detail = await fetchVideoDetail(videoId);
      if (!detail) {
        setError("영상 정보를 가져올 수 없습니다. 비공개/삭제된 영상이거나 잘못된 ID일 수 있습니다.");
        return;
      }

      const channel = await fetchChannelDetail(detail.channelId);
      if (!channel) {
        setError("채널 정보를 가져올 수 없습니다.");
        return;
      }

      // 캐시된 search 결과가 없으므로 채널명/제목은 다른 경로로 가져와야 하지만,
      // 일단 description의 첫 줄을 제목 대용으로 사용하지 않고, videoId를 표시
      const avgViews = channel.videoCount > 0 ? Math.round(channel.viewCount / channel.videoCount) : 0;

      setData({
        videoId,
        videoTitle: detail.description?.split("\n")[0]?.slice(0, 80) || videoId,
        videoViews: detail.rawViewCount,
        videoLikes: detail.rawLikeCount,
        channelTitle: channel.title ?? "(채널명 없음)",
        channelSubscribers: channel.subscriberCount,
        channelTotalViews: channel.viewCount,
        channelVideoCount: channel.videoCount,
        channelAvgViews: avgViews,
      });
    } catch (e) {
      console.error(e);
      setError("데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // ─── 2단계: 사용자가 원하는 계산 버튼 클릭 시 클라이언트 계산 ───
  function calc(type: "ratio_avg" | "ratio_sub" | "engagement" | "like_ratio") {
    if (!data) return;
    const list: CalcResult[] = [];

    if (type === "ratio_avg") {
      if (!data.channelAvgViews) {
        list.push({ label: "❌ 계산 불가", value: "-", formula: "채널 평균 조회수가 0입니다." });
      } else {
        const r = data.videoViews / data.channelAvgViews;
        const pct = ((data.videoViews - data.channelAvgViews) / data.channelAvgViews) * 100;
        list.push({
          label: "📊 채널 평균 조회수 대비 비율",
          value: `${r.toFixed(2)}x  (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`,
          formula: `${data.videoViews.toLocaleString()} ÷ ${data.channelAvgViews.toLocaleString()}`,
        });
      }
    }

    if (type === "ratio_sub") {
      if (!data.channelSubscribers) {
        list.push({ label: "❌ 계산 불가", value: "-", formula: "구독자 수가 0입니다." });
      } else {
        const r = data.videoViews / data.channelSubscribers;
        list.push({
          label: "👥 구독자 대비 조회수 비율",
          value: `${r.toFixed(2)}x`,
          formula: `${data.videoViews.toLocaleString()} ÷ ${data.channelSubscribers.toLocaleString()}`,
          note: "1.0x = 구독자 수와 같은 조회수",
        });
      }
    }

    if (type === "engagement") {
      if (!data.videoViews) {
        list.push({ label: "❌ 계산 불가", value: "-", formula: "조회수가 0입니다." });
      } else {
        const r = (data.videoLikes / data.videoViews) * 100;
        list.push({
          label: "👍 참여율 (Like / View)",
          value: `${r.toFixed(2)}%`,
          formula: `(${data.videoLikes.toLocaleString()} ÷ ${data.videoViews.toLocaleString()}) × 100`,
          note: "업계 평균: 약 1~4%",
        });
      }
    }

    if (type === "like_ratio") {
      if (!data.channelSubscribers) {
        list.push({ label: "❌ 계산 불가", value: "-", formula: "구독자 수가 0입니다." });
      } else {
        const r = data.videoLikes / data.channelSubscribers;
        list.push({
          label: "❤️ 구독자 대비 좋아요 비율",
          value: `${(r * 100).toFixed(2)}%`,
          formula: `${data.videoLikes.toLocaleString()} ÷ ${data.channelSubscribers.toLocaleString()}`,
        });
      }
    }

    // 같은 종류 결과는 최신 것만 보여줌
    setResults((prev) => [...prev.filter((p) => p.label !== list[0].label), ...list]);
  }

  function resetAll() {
    setData(null);
    setResults([]);
    setError(null);
    setUrl("");
  }

  return (
    <div className="space-y-6">
      {/* ─── URL 입력 + 가져오기 버튼 ─── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          1️⃣ 영상 URL 입력
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/xxxxxxxxxxx 또는 https://youtube.com/watch?v=xxxxxxxxxxx"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500 transition"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleFetch();
            }}
          />
          <button
            onClick={handleFetch}
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                가져오는 중...
              </>
            ) : (
              "📥 데이터 가져오기"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* ─── Raw 데이터 표시 (가져온 후) ─── */}
      {data && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">YouTube API 원본 데이터</p>
              <p className="text-sm font-medium text-gray-300 line-clamp-1">{data.videoTitle}</p>
              <p className="text-xs text-gray-500 mt-0.5">채널: {data.channelTitle}</p>
            </div>
            <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap">
              초기화 ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-800/60 rounded-lg p-3">
              <div className="text-gray-500 mb-1">영상 조회수</div>
              <div className="text-white font-bold">{data.videoViews.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3">
              <div className="text-gray-500 mb-1">영상 좋아요</div>
              <div className="text-white font-bold">{data.videoLikes.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3">
              <div className="text-gray-500 mb-1">채널 구독자</div>
              <div className="text-white font-bold">{data.channelSubscribers.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3">
              <div className="text-gray-500 mb-1">채널 평균 조회수</div>
              <div className="text-white font-bold">{data.channelAvgViews.toLocaleString()}</div>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-gray-600">
            ※ 위 숫자는 YouTube API가 반환한 그대로의 값입니다. 채널 평균은 (채널 총 조회수 ÷ 총 영상 수) 단순 산술입니다.
          </p>
        </div>
      )}

      {/* ─── 계산 도구 버튼 (사용자가 누를 때만 작동) ─── */}
      {data && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            2️⃣ 원하는 계산 버튼 클릭 (사용자가 직접 실행)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => calc("ratio_avg")}
              className="px-4 py-3 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-700/60 hover:border-teal-500 text-teal-300 hover:text-teal-200 text-sm rounded-xl transition text-left"
            >
              📊 채널 평균 조회수 대비 비율
              <span className="block text-[10px] text-gray-500 mt-0.5">영상 조회수 ÷ 채널 평균 조회수</span>
            </button>
            <button
              onClick={() => calc("ratio_sub")}
              className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-700/60 hover:border-blue-500 text-blue-300 hover:text-blue-200 text-sm rounded-xl transition text-left"
            >
              👥 구독자 대비 조회수 비율
              <span className="block text-[10px] text-gray-500 mt-0.5">영상 조회수 ÷ 채널 구독자</span>
            </button>
            <button
              onClick={() => calc("engagement")}
              className="px-4 py-3 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-700/60 hover:border-pink-500 text-pink-300 hover:text-pink-200 text-sm rounded-xl transition text-left"
            >
              👍 참여율 (Like / View)
              <span className="block text-[10px] text-gray-500 mt-0.5">(좋아요 ÷ 조회수) × 100%</span>
            </button>
            <button
              onClick={() => calc("like_ratio")}
              className="px-4 py-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-700/60 hover:border-orange-500 text-orange-300 hover:text-orange-200 text-sm rounded-xl transition text-left"
            >
              ❤️ 구독자 대비 좋아요 비율
              <span className="block text-[10px] text-gray-500 mt-0.5">좋아요 ÷ 채널 구독자</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 결과 표시 (사용자 클릭 후에만 나타남) ─── */}
      {results.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">🧮 사용자 자가 계산 결과</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                ※ 사용자가 직접 실행한 단순 산술 결과입니다. YouTube 공식 메트릭이 아니며, bibl lab의 평가/등급이 아닙니다.
              </p>
            </div>
            <button
              onClick={() => setResults([])}
              className="text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap"
            >
              모두 지우기 ✕
            </button>
          </div>

          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                  <div className="text-sm font-medium text-gray-300">{r.label}</div>
                  <div className="text-xl font-extrabold text-white">{r.value}</div>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">계산식: {r.formula}</div>
                {r.note && <div className="text-[10px] text-gray-600 mt-1">{r.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
