"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import ChannelReport from "./ChannelReport";
import { Video } from "@/types";
import { getMoreVideos } from "../actions";

interface Props {
  initialData: Video[];
  query: string;
  filter: string;
  region: string;
  canAlgorithm: boolean;
  canCollect: boolean;
  canChannelReport: boolean;
  canLoadMore: boolean;
  resultLimit: number;
  nextPageToken?: string;
  nextPageTokenLong?: string;
  nextPageTokenShorts?: string;
}

// videoId 기준 중복 제거
function dedup(items: Video[]): Video[] {
  const seen = new Set<string>();
  return items.filter((v) => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
}

type SortKey = "viewCount" | "subscriberCountRaw" | "scoreValue" | "publishedAtRaw" | "performanceRatioRaw" | "algorithmScore" | null;
type SortOrder = "asc" | "desc";

export default function SearchResultList({
  initialData, query, filter, region, canAlgorithm, canCollect, canChannelReport,
  canLoadMore, resultLimit,
  nextPageToken: initPageToken,
  nextPageTokenLong: initPageTokenLong,
  nextPageTokenShorts: initPageTokenShorts,
}: Props) {
  const [videos, setVideos] = useState<Video[]>(() => dedup(initialData || []));
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showChannelReport, setShowChannelReport] = useState(false);
  const [collectToast, setCollectToast] = useState<{ count: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 더보기 상태
  const [pageToken, setPageToken] = useState<string | undefined>(initPageToken);
  const [pageTokenLong, setPageTokenLong] = useState<string | undefined>(initPageTokenLong);
  const [pageTokenShorts, setPageTokenShorts] = useState<string | undefined>(initPageTokenShorts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedVideos = useMemo(() => {
    if (!sortKey) return videos;
    const get = (v: Video): number => {
      switch (sortKey) {
        case "viewCount": return v.viewCount ?? 0;
        case "subscriberCountRaw": return v.subscriberCountRaw ?? 0;
        case "scoreValue": return v.scoreValue ?? 0;
        case "publishedAtRaw": return v.publishedAtRaw ?? 0;
        case "performanceRatioRaw": return v.performanceRatioRaw ?? 0;
        case "algorithmScore": return v.algorithmScore ?? 0;
        default: return 0;
      }
    };
    return [...videos].sort((a, b) =>
      sortOrder === "asc" ? get(a) - get(b) : get(b) - get(a)
    );
  }, [videos, sortKey, sortOrder]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === sortedVideos.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(sortedVideos.map((v) => v.videoId)));
  };

  // 더보기
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    if (videos.length >= resultLimit) return;
    setIsLoadingMore(true);
    try {
      if (filter === "all") {
        const [longRes, shortsRes] = await Promise.all([
          pageTokenLong
            ? getMoreVideos(query, "long", pageTokenLong, "relevance", region)
            : Promise.resolve({ items: [], nextPageToken: undefined, error: null }),
          pageTokenShorts
            ? getMoreVideos(query, "shorts", pageTokenShorts, "relevance", region)
            : Promise.resolve({ items: [], nextPageToken: undefined, error: null }),
        ]);
        const newItems = [...(longRes.items || []), ...(shortsRes.items || [])];
        setVideos((prev) => dedup([...prev, ...newItems]));
        setPageTokenLong(longRes.nextPageToken);
        setPageTokenShorts(shortsRes.nextPageToken);
      } else {
        if (!pageToken) return;
        const result = await getMoreVideos(query, filter, pageToken, "relevance", region);
        setVideos((prev) => dedup([...prev, ...(result.items || [])]));
        setPageToken(result.nextPageToken);
      }
    } catch {
      // 로드 실패 시 조용히 무시
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, isLoadingMore, pageToken, pageTokenLong, pageTokenShorts, query, resultLimit, videos.length]);

  // 더보기 가능 여부
  const hasMore = canLoadMore && videos.length < resultLimit && (
    filter === "all"
      ? (!!pageTokenLong || !!pageTokenShorts)
      : !!pageToken
  );

  // 영상 수집: Pro/Business 전용 — CSV 다운로드 + 서버 저장
  const handleCollect = useCallback(async () => {
    if (!canCollect) {
      alert("영상 수집은 Pro 플랜부터 사용 가능합니다.\n/pricing 에서 업그레이드하세요.");
      return;
    }
    const targets = checkedIds.size > 0
      ? sortedVideos.filter((v) => checkedIds.has(v.videoId))
      : sortedVideos;
    const header = "제목,채널,조회수,구독자,반응도,아웃라이어,게시일,URL";
    const rows = targets.map((v) =>
      [
        `"${v.title?.replace(/"/g, '""') ?? ''}"`,
        `"${v.channelTitle?.replace(/"/g, '""') ?? ''}"`,
        v.viewCount ?? '',
        v.subscriberCount ?? '',
        v.score ?? '',
        v.performanceRatio ?? '',
        v.publishedAt ?? '',
        `https://youtube.com/watch?v=${v.videoId}`,
      ].join(",")
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `bibl_영상수집_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 서버에도 저장 (수집한 영상 페이지에서 확인 가능)
    try {
      await fetch("/api/saved-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videos: targets.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            channelId: v.channelId,
            channelTitle: v.channelTitle,
            channelThumbnail: v.channelThumbnail,
            subscriberCount: v.subscriberCount,
            viewCount: v.viewCount,
            publishedAt: v.publishedAt,
            score: v.score,
            performanceRatio: v.performanceRatio,
            query,
          })),
        }),
      });
    } catch {
      // 서버 저장 실패해도 CSV 다운로드는 성공했으므로 조용히 넘어감
    }

    if (toastTimer.current) clearTimeout(toastTimer.current);
    setCollectToast({ count: targets.length });
    toastTimer.current = setTimeout(() => setCollectToast(null), 5000);
  }, [sortedVideos, checkedIds, canCollect, query]);

  // 채널 제거: 체크된 영상들의 채널ID를 블랙리스트로 추가해서 필터링
  const handleRemoveChannels = useCallback(() => {
    if (checkedIds.size === 0) {
      alert("제거할 채널의 영상을 먼저 선택해주세요.");
      return;
    }
    const channelIdsToRemove = new Set(
      sortedVideos.filter((v) => checkedIds.has(v.videoId)).map((v) => v.channelId)
    );
    setVideos((prev) => prev.filter((v) => !channelIdsToRemove.has(v.channelId)));
    setCheckedIds(new Set());
  }, [sortedVideos, checkedIds]);

  useEffect(() => {
    const onCollect = () => handleCollect();
    const onRemoveChannels = () => handleRemoveChannels();
    const onChannelReport = () => setShowChannelReport(true);
    window.addEventListener("TRIGGER_COLLECT", onCollect);
    window.addEventListener("TRIGGER_REMOVE_CHANNELS", onRemoveChannels);
    window.addEventListener("TRIGGER_CHANNEL_REPORT", onChannelReport);
    return () => {
      window.removeEventListener("TRIGGER_COLLECT", onCollect);
      window.removeEventListener("TRIGGER_REMOVE_CHANNELS", onRemoveChannels);
      window.removeEventListener("TRIGGER_CHANNEL_REPORT", onChannelReport);
    };
  }, [handleCollect, handleRemoveChannels]);

  // 조회수 통계 — 필터탭 옆 ViewStatsInline 에 이벤트로 전달
  useEffect(() => {
    const views = videos.map((v) => v.viewCount ?? 0).filter((v) => v > 0);
    const total = views.reduce((sum, v) => sum + v, 0);
    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("UPDATE_VIEW_STATS", { detail: { total, count: videos.length } }));
    }, 0);
    return () => clearTimeout(t);
  }, [videos]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-700 ml-1 text-[10px]">↕</span>;
    return sortOrder === "asc"
      ? <span className="text-teal-400 ml-1 text-[10px]">▲</span>
      : <span className="text-teal-400 ml-1 text-[10px]">▼</span>;
  };

  if (!initialData || initialData.length === 0) {
    return (
      <div className="p-12 text-center border border-gray-800 rounded-xl bg-gray-900/50 mt-4">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-400 font-medium">검색 결과가 없어요</p>
        <p className="text-gray-600 text-sm mt-1">다른 키워드로 검색해보세요</p>
      </div>
    );
  }

  const allChecked = checkedIds.size === sortedVideos.length && sortedVideos.length > 0;

  // 툴팁이 있는 컬럼 헤더
  const ColHeader = ({
    label, tip, sortable, sortKeyName, children,
  }: {
    label: string; tip: string; sortable?: boolean; sortKeyName?: SortKey; children?: React.ReactNode;
  }) => (
    <div
      className="relative group flex items-center justify-center gap-0.5 cursor-default"
      onClick={sortable && sortKeyName ? () => handleSort(sortKeyName) : undefined}
      style={sortable ? { cursor: "pointer" } : undefined}
    >
      <span className={sortable ? "hover:text-white" : ""}>{label}</span>
      {children}
      {/* 툴팁 */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      w-52 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 shadow-xl
                      text-[11px] text-gray-300 leading-relaxed text-left whitespace-normal
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {tip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
      </div>
    </div>
  );

  return (
    <div className="w-full mt-4 pb-12">


      {/* 테이블 헤더 */}
      <div
        className="hidden md:grid items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-800 text-[11px] text-gray-500 font-medium rounded-t-lg select-none"
        style={{ gridTemplateColumns: canAlgorithm ? "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px 90px" : "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px" }}
      >
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="w-3.5 h-3.5 accent-teal-500 cursor-pointer"
          />
        </div>
        <div className="text-center">구분</div>
        <div className="text-center">썸네일 ({sortedVideos.length})</div>
        <div className="pl-1">제목</div>
        <div onClick={() => handleSort("viewCount")} className="cursor-pointer hover:text-white flex items-center justify-center">
          조회수 {renderSortIcon("viewCount")}
        </div>
        <div onClick={() => handleSort("subscriberCountRaw")} className="cursor-pointer hover:text-white flex items-center justify-center">
          구독자 {renderSortIcon("subscriberCountRaw")}
        </div>
        <ColHeader label="아웃라이어" sortable sortKeyName="performanceRatioRaw"
          tip="해당 채널 평균 조회수보다 몇 배 조회수 높은 영상인가">
          {renderSortIcon("performanceRatioRaw")}
        </ColHeader>
        <ColHeader label="반응도" sortable sortKeyName="scoreValue"
          tip="지금 유튜브 전체에서 이 영상 성과가 어떤가">
          {renderSortIcon("scoreValue")}
        </ColHeader>
        {/* 알고리즘 확률 — Starter 이상만 */}
        {canAlgorithm && (
          <ColHeader label="알고리즘 🔥" sortable sortKeyName="algorithmScore"
            tip="지금 이 영상이 알고리즘을 탈 확률">
            {renderSortIcon("algorithmScore")}
          </ColHeader>
        )}
        <div className="flex items-center justify-center">
          트렌드
        </div>
        <div onClick={() => handleSort("publishedAtRaw")} className="cursor-pointer hover:text-white flex items-center justify-center">
          게시일 {renderSortIcon("publishedAtRaw")}
        </div>
      </div>

      {/* 리스트 */}
      <div className="border border-gray-800 border-t-0 rounded-b-lg divide-y divide-gray-800/60 overflow-hidden">
        {sortedVideos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            checked={checkedIds.has(video.videoId)}
            onCheck={() => toggleCheck(video.videoId)}
            onClick={() => setSelectedVideo(video)}
            canAlgorithm={canAlgorithm}
          />
        ))}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-teal-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin w-4 h-4 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                불러오는 중...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                더보기
              </>
            )}
          </button>
        </div>
      )}


      {/* YouTube 결과 소진 — 더 이상 가져올 데이터 없음 (limit 미만) */}
      {canLoadMore && !hasMore && videos.length < resultLimit && videos.length > 0 && (
        <div className="mt-6 flex justify-center">
          <p className="text-xs text-gray-600">이 키워드의 검색 결과를 모두 불러왔습니다 ({videos.length}건)</p>
        </div>
      )}

      {/* 결과 한도 도달 — 플랜 업그레이드 유도 */}
      {canLoadMore && !hasMore && videos.length >= resultLimit && resultLimit < 1000 && (
        <div className="mt-6 p-5 bg-gradient-to-r from-teal-950/60 to-gray-900/80 border border-teal-800/60 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">🚀 더 많은 결과가 필요하신가요?</p>
              <p className="text-xs text-gray-400 mt-1">
                상위 플랜으로 업그레이드하면 더 많은 결과를 볼 수 있습니다.
              </p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition whitespace-nowrap"
            >
              업그레이드 →
            </Link>
          </div>
        </div>
      )}

      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
      {showChannelReport && <ChannelReport videos={videos} onClose={() => setShowChannelReport(false)} />}

      {/* 수집 완료 토스트 */}
      {collectToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 border border-teal-700 rounded-xl px-4 py-3 shadow-xl animate-in slide-in-from-bottom-4">
          <span className="text-xl">📥</span>
          <div>
            <p className="text-sm font-semibold text-white">{collectToast.count}개 수집 완료!</p>
            <Link href="/saved" className="text-xs text-teal-400 hover:text-teal-300">
              수집한 영상 보기 →
            </Link>
          </div>
          <button
            onClick={() => setCollectToast(null)}
            className="ml-2 text-gray-600 hover:text-gray-400 text-xs"
          >✕</button>
        </div>
      )}
    </div>
  );
}
