"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import { getMoreVideos } from "../actions";
import { Video } from "@/types";

interface Props {
  initialData: Video[];
  initialToken?: string;
  query: string;
  filter: string;
}

type SortKey = "viewCount" | "subscriberCountRaw" | "scoreValue" | "publishedAtRaw" | "performanceRatioRaw" | "algorithmScore" | null;
type SortOrder = "asc" | "desc";

export default function SearchResultList({ initialData, initialToken, query, filter }: Props) {
  const [videos, setVideos] = useState<Video[]>(initialData || []);
  const [nextToken, setNextToken] = useState<string | undefined>(initialToken);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVideos(initialData || []);
    setNextToken(initialToken);
    setSortKey(null);
    setCheckedIds(new Set());
  }, [initialData, initialToken, filter]);

  const handleLoadMore = useCallback(async () => {
    if (!nextToken || loading) return;
    setLoading(true);
    try {
      const res = await getMoreVideos(query, filter, nextToken);
      if (res) {
        if (res.items.length > 0) setVideos((prev) => [...prev, ...res.items]);
        setNextToken(res.nextPageToken || undefined);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [nextToken, loading, query, filter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortOrder("desc"); }
  };

  const sortedVideos = useMemo(() => {
    if (!sortKey) return videos;
    return [...videos].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
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

  // 영상 수집: 체크된 영상(없으면 전체) CSV 복사
  const handleCollect = useCallback(() => {
    const targets = checkedIds.size > 0
      ? sortedVideos.filter((v) => checkedIds.has(v.videoId))
      : sortedVideos;
    const header = "제목,채널,조회수,구독자,성과도,게시일,URL";
    const rows = targets.map((v) =>
      [
        `"${v.title?.replace(/"/g, '""') ?? ''}"`,
        `"${v.channelTitle?.replace(/"/g, '""') ?? ''}"`,
        v.viewCount ?? '',
        v.subscriberCount ?? '',
        v.score ?? '',
        v.publishedAt ?? '',
        `https://youtube.com/watch?v=${v.videoId}`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    navigator.clipboard.writeText(csv).then(() => {
      alert(`${targets.length}개 영상 데이터가 클립보드에 복사됐습니다!\nExcel에 붙여넣기 하세요.`);
    }).catch(() => {
      // fallback
      const el = document.createElement("textarea");
      el.value = csv;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      alert(`${targets.length}개 영상 데이터가 복사됐습니다!`);
    });
  }, [sortedVideos, checkedIds]);

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
    const onTrigger = () => { if (!loading) handleLoadMore(); };
    window.addEventListener("TRIGGER_LOAD_MORE", onTrigger);
    return () => window.removeEventListener("TRIGGER_LOAD_MORE", onTrigger);
  }, [handleLoadMore, loading]);

  useEffect(() => {
    const onCollect = () => handleCollect();
    const onRemoveChannels = () => handleRemoveChannels();
    window.addEventListener("TRIGGER_COLLECT", onCollect);
    window.addEventListener("TRIGGER_REMOVE_CHANNELS", onRemoveChannels);
    return () => {
      window.removeEventListener("TRIGGER_COLLECT", onCollect);
      window.removeEventListener("TRIGGER_REMOVE_CHANNELS", onRemoveChannels);
    };
  }, [handleCollect, handleRemoveChannels]);

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

  return (
    <div className="w-full mt-4 pb-12">
      {/* 테이블 헤더 */}
      <div
        className="hidden md:grid items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-800 text-[11px] text-gray-500 font-medium rounded-t-lg select-none"
        style={{ gridTemplateColumns: "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px" }}
      >
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="w-3.5 h-3.5 accent-teal-500 cursor-pointer"
          />
        </div>
        <div className="text-center">CC</div>
        <div className="text-center">썸네일 ({sortedVideos.length})</div>
        <div className="pl-1">제목</div>
        <div onClick={() => handleSort("viewCount")} className="cursor-pointer hover:text-white flex items-center justify-center">
          조회수 {renderSortIcon("viewCount")}
        </div>
        <div onClick={() => handleSort("subscriberCountRaw")} className="cursor-pointer hover:text-white flex items-center justify-center">
          구독자 {renderSortIcon("subscriberCountRaw")}
        </div>
        <div onClick={() => handleSort("performanceRatioRaw")} className="cursor-pointer hover:text-white flex items-center justify-center">
          아웃라이어 {renderSortIcon("performanceRatioRaw")}
        </div>
        <div onClick={() => handleSort("scoreValue")} className="cursor-pointer hover:text-white flex items-center justify-center">
          성과도 {renderSortIcon("scoreValue")}
        </div>
        <div onClick={() => handleSort("algorithmScore")} className="cursor-pointer hover:text-white flex items-center justify-center">
          알고리즘 🔥 {renderSortIcon("algorithmScore")}
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
          />
        ))}
      </div>

      {loading && (
        <div className="py-6 text-center text-gray-400 flex justify-center items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          추가 데이터 불러오는 중...
        </div>
      )}

      {!loading && nextToken && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-full border border-gray-700 transition-colors"
          >
            더 보기
          </button>
        </div>
      )}

      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  );
}
