"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoCard, VideoCardModel } from "@/components/VideoCard";

type SortOrder = "relevance" | "viewCount-desc" | "viewCount-asc";

const gridCols = "grid-cols-[128px_1fr_100px_180px_200px]";

interface SearchResultListProps {
  initialData: VideoCardModel[];
}

export default function SearchResultList({ initialData }: SearchResultListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState<SortOrder>(
    (searchParams.get("sort") as SortOrder) || "relevance",
  );

  // initialData를 기반으로 정렬 함수
  const getSortedVideos = (data: VideoCardModel[], currentSort: SortOrder) => {
    if (currentSort === "viewCount-desc") {
      return [...data].sort((a, b) => b.viewCount - a.viewCount);
    } else if (currentSort === "viewCount-asc") {
      return [...data].sort((a, b) => a.viewCount - b.viewCount);
    }
    return data; // "relevance" 또는 기타 경우 (서버에서 이미 관련성 순으로 옴)
  };

  const [displayedVideos, setDisplayedVideos] = useState<VideoCardModel[]>(() =>
    getSortedVideos(initialData, sort),
  );

  useEffect(() => {
    // initialData나 sort 파라미터가 변경될 때마다 displayedVideos를 업데이트
    setDisplayedVideos(getSortedVideos(initialData, sort));
  }, [initialData, sort]);

  const handleSortChange = (newSort: SortOrder) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`?${params.toString()}`);
  };

  // 오류 처리 (현재 search/page.tsx에서 이미 error를 처리하므로 여기서는 제거)
  if (initialData.length === 0) {
    return (
      <div className="card rounded-2xl p-6">
        <div className="text-lg font-semibold text-white">결과가 없어요.</div>
        <div className="mt-2 text-sm text-white/60">
          다른 키워드로 다시 시도해보세요.
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl">
      {/* 헤더 */}
      <div
        className={`card sticky top-0 z-10 hidden items-center rounded-t-2xl border-b border-white/10 bg-black/50 px-4 py-3 text-xs font-semibold uppercase text-white/70 backdrop-blur-sm md:grid ${gridCols}`}
      >
        <div>썸네일</div>
        <div>제목</div>
        <button
          onClick={() =>
            handleSortChange(
              sort === "viewCount-desc" ? "viewCount-asc" : "viewCount-desc",
            )
          }
          className="flex items-center justify-end gap-1 text-right"
        >
          조회수
          {sort === "viewCount-desc" && <span className="text-xs">▼</span>}
          {sort === "viewCount-asc" && <span className="text-xs">▲</span>}
        </button>
        <div className="text-right">채널명(구독자)</div>
        <div className="text-right">추세</div>
      </div>

      <div className="min-w-full overflow-x-auto">
        <div className="divide-y divide-white/10 border-b border-white/10 last:border-b-0">
          {displayedVideos.map((v) => (
            <VideoCard key={v.videoId} video={v} />
          ))}
        </div>
      </div>
    </div>
  );
}