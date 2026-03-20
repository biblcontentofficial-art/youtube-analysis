"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import { getMoreVideos } from "../actions";
import { Video } from "@/types";

interface Props {
  initialData: Video[];
  initialToken?: string;
  query: string;
  filter: string;
  canAlgorithm: boolean;
  canCollect: boolean;
  resultLimit: number;
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

// nextToken 소진 시 다른 정렬로 새 배치 요청 (관련도 → 조회수 → 최신 → 평점)
const EXTRA_ORDERS = ["viewCount", "date", "rating"] as const;
// quota 보호: 더 보기 1회당 최대 5페이지 (페이지당 ~102 units → 최대 510 units/클릭)
const MAX_PAGES_PER_LOAD = 5;

export default function SearchResultList({ initialData, initialToken, query, filter, canAlgorithm, canCollect, resultLimit }: Props) {
  const [videos, setVideos] = useState<Video[]>(() => dedup(initialData || []));
  const [nextToken, setNextToken] = useState<string | undefined>(initialToken);
  const [orderPhase, setOrderPhase] = useState(0); // 0=relevance 소진됨, 1=viewCount, 2=date, 3=rating
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  // ref 기반 동시 실행 방지
  const isLoadingRef = useRef(false);

  // 상태 초기화는 page.tsx의 key={query-filter-count}가 변경될 때
  // 컴포넌트 리마운트로 처리됨 (useState 초기값이 자동 재설정)
  // useEffect로 처리하면 서버에서 새 배열 참조가 올 때마다 setSortKey(null) 발동 → 정렬 버그

  // 검색마다 플랜 resultLimit 만큼 추가 로드
  // nextToken 소진 시 다음 order로 새 배치 요청
  const handleLoadMore = useCallback(async () => {
    if (isLoadingRef.current) return;
    // nextToken 없고 order도 모두 소진됐으면 종료
    if (!nextToken && orderPhase >= EXTRA_ORDERS.length) return;

    isLoadingRef.current = true;
    setLoading(true);
    setLoadError(false);
    try {
      // null = "페이지 소진" 센티널, undefined = "새 order 첫 페이지"
      let token: string | null | undefined = nextToken;
      let currentOrder: string;
      let currentPhase = orderPhase;

      if (token) {
        // 현재 order 계속 (token = 기존 nextPageToken 문자열)
        currentOrder = currentPhase === 0 ? "relevance" : EXTRA_ORDERS[currentPhase - 1];
      } else {
        // nextToken 소진 → 다음 order로 새 배치 (첫 페이지부터)
        currentOrder = EXTRA_ORDERS[currentPhase];
        currentPhase = currentPhase + 1;
        setOrderPhase(currentPhase);
        token = undefined; // undefined = 첫 페이지 요청
      }

      const collected: Video[] = [];
      let pagesThisLoad = 0;
      // token === null 이면 페이지 소진, token !== null (undefined 포함) 이면 계속 가능
      // MAX_PAGES_PER_LOAD: quota 보호 (admin resultLimit=9999 무한루프 방지)
      while (collected.length < resultLimit && token !== null && pagesThisLoad < MAX_PAGES_PER_LOAD) {
        pagesThisLoad++;
        const res = await getMoreVideos(query, filter, token ?? undefined, currentOrder);
        if (!res || res.items.length === 0) break;
        collected.push(...res.items);
        // nextPageToken 없으면 null로 설정 → 루프 종료 조건 충족
        token = res.nextPageToken ?? null;
        if (collected.length >= resultLimit) break;
      }

      if (collected.length > 0) {
        setVideos((prev) => {
          if (prev.length >= resultLimit) return prev; // 이미 한도 도달
          const existingIds = new Set(prev.map((v) => v.videoId));
          const newItems = collected.filter((item) => !existingIds.has(item.videoId));
          return [...prev, ...newItems].slice(0, resultLimit); // 총 건수 resultLimit으로 캡
        });
      }
      // null → undefined 변환 (nextToken state 타입 맞춤)
      setNextToken(token ?? undefined);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [nextToken, orderPhase, query, filter, resultLimit]);

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

  // 영상 수집: Pro/Business 전용 — CSV 파일 다운로드
  const handleCollect = useCallback(() => {
    if (!canCollect) {
      alert("영상 수집은 Pro 플랜부터 사용 가능합니다.\n/pricing 에서 업그레이드하세요.");
      return;
    }
    const targets = checkedIds.size > 0
      ? sortedVideos.filter((v) => checkedIds.has(v.videoId))
      : sortedVideos;
    const header = "제목,채널,조회수,구독자,성과도,아웃라이어,게시일,URL";
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
    // BOM(\uFEFF) 추가 — Excel 한글 깨짐 방지
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
  }, [sortedVideos, checkedIds, canCollect]);

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
    const onTrigger = () => handleLoadMore();
    window.addEventListener("TRIGGER_LOAD_MORE", onTrigger);
    return () => window.removeEventListener("TRIGGER_LOAD_MORE", onTrigger);
  }, [handleLoadMore]);

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

  // 조회수 통계 — 필터탭 옆 ViewStatsInline 에 이벤트로 전달
  // setTimeout(0): ViewStatsInline 리스너가 먼저 등록된 뒤 이벤트 발사 보장
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

  return (
    <div className="w-full mt-4 pb-12">

      {/* 테이블 헤더 */}
      <div
        className="hidden md:grid items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-800 text-[11px] text-gray-500 font-medium rounded-t-lg select-none"
        style={{ gridTemplateColumns: canAlgorithm ? "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px" : "32px 36px 110px 1fr 90px 140px 80px 80px 90px" }}
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
        {/* 알고리즘 확률 — Starter 이상만 */}
        {canAlgorithm && (
          <div onClick={() => handleSort("algorithmScore")} className="cursor-pointer hover:text-white flex items-center justify-center">
            알고리즘 🔥 {renderSortIcon("algorithmScore")}
          </div>
        )}
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

      {loading && (
        <div className="py-6 text-center text-gray-400 flex justify-center items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          추가 데이터 불러오는 중...
        </div>
      )}

      {loadError && !loading && (
        <div className="mt-4 p-4 bg-red-950/40 border border-red-800 rounded-xl text-center text-sm">
          <p className="text-red-400 mb-2">데이터를 불러오지 못했습니다.</p>
          <button
            onClick={handleLoadMore}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 더 보기: nextToken/order 남아있고 아직 resultLimit 미달 시 표시 */}
      {!loading && !loadError && videos.length < resultLimit && (nextToken || orderPhase < EXTRA_ORDERS.length) && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-full border border-gray-700 transition-colors"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 플랜 한도 도달 — 업그레이드 유도 */}
      {!loading && videos.length >= resultLimit && (
        <div className="mt-6 p-4 bg-gray-900/60 border border-gray-800 rounded-xl text-center">
          <p className="text-xs text-gray-500">
            현재 플랜 최대 <span className="text-white font-semibold">{resultLimit}건</span> 표시 중.
            <a href="/pricing" className="ml-2 text-teal-400 hover:text-teal-300 underline">플랜 업그레이드로 더 보기 →</a>
          </p>
        </div>
      )}

      {/* 더 이상 결과 없음 (플랜 한도 이전에 API 소진) */}
      {!loading && videos.length < resultLimit && !nextToken && orderPhase >= EXTRA_ORDERS.length && videos.length > 0 && (
        <div className="mt-6 p-4 bg-gray-900/60 border border-gray-800 rounded-xl text-center">
          <p className="text-xs text-gray-500">
            총 <span className="text-white font-semibold">{videos.length}건</span> — 모든 관련 영상을 가져왔습니다.
          </p>
        </div>
      )}

      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  );
}
