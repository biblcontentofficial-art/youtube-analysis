"use client";

import { useState } from "react";
import { SavedVideo } from "@/lib/db";

interface Props {
  initialVideos: SavedVideo[];
}

export default function SavedVideoList({ initialVideos }: Props) {
  const [videos, setVideos] = useState<SavedVideo[]>(initialVideos);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const uniqueQueries = [...new Set(videos.map((v) => v.query).filter(Boolean))] as string[];

  const filtered = videos.filter((v) => {
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.channel_title?.toLowerCase().includes(search.toLowerCase());
    const matchQuery = !filterQuery || v.query === filterQuery;
    return matchSearch && matchQuery;
  });

  const handleDelete = async (videoId: string) => {
    setDeleting(videoId);
    try {
      await fetch("/api/saved-videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      setVideos((prev) => prev.filter((v) => v.video_id !== videoId));
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`수집한 영상 ${videos.length}개를 모두 삭제하시겠습니까?`)) return;
    try {
      await fetch("/api/saved-videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setVideos([]);
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (videos.length === 0) {
    return (
      <div className="p-16 text-center border border-gray-800 rounded-xl bg-gray-900/50">
        <div className="text-4xl mb-4">🔖</div>
        <p className="text-gray-400 font-medium">수집한 영상이 없어요</p>
        <p className="text-gray-600 text-sm mt-1">영상 찾기에서 영상을 수집하면 여기서 확인할 수 있습니다</p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 / 검색 바 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목 또는 채널 검색..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition w-64"
        />
        {uniqueQueries.length > 0 && (
          <select
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600 transition"
          >
            <option value="">전체 키워드</option>
            {uniqueQueries.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-gray-500 ml-auto">총 {filtered.length}개</span>
        <button
          onClick={handleClearAll}
          className="text-xs text-red-500 hover:text-red-400 border border-red-900/50 hover:border-red-700 px-3 py-1.5 rounded-lg transition"
        >
          전체 삭제
        </button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-900 text-gray-500 text-xs">
              <th className="px-3 py-3 text-left">영상</th>
              <th className="px-3 py-3 text-right">조회수</th>
              <th className="px-3 py-3 text-right hidden md:table-cell">구독자</th>
              <th className="px-3 py-3 text-center hidden md:table-cell">성과도</th>
              <th className="px-3 py-3 text-center hidden lg:table-cell">검색 키워드</th>
              <th className="px-3 py-3 text-center hidden lg:table-cell">수집일</th>
              <th className="px-3 py-3 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((v) => (
              <tr key={v.video_id} className="bg-gray-900/30 hover:bg-gray-900/60 transition-colors">
                <td className="px-3 py-3">
                  <a
                    href={`https://youtube.com/watch?v=${v.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded-md shrink-0" />
                    ) : (
                      <div className="w-20 h-12 bg-gray-800 rounded-md shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-teal-300 transition-colors">
                        {v.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                        {v.channel_thumbnail && (
                          <img src={v.channel_thumbnail} alt="" className="w-3.5 h-3.5 rounded-full" />
                        )}
                        {v.channel_title}
                      </p>
                    </div>
                  </a>
                </td>
                <td className="px-3 py-3 text-right text-gray-300 whitespace-nowrap">
                  {v.view_count ? v.view_count.toLocaleString() + "회" : "-"}
                </td>
                <td className="px-3 py-3 text-right text-gray-400 whitespace-nowrap hidden md:table-cell">
                  {v.subscriber_count || "-"}
                </td>
                <td className="px-3 py-3 text-center hidden md:table-cell">
                  {v.score ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      v.score === "Good" ? "bg-teal-900/50 text-teal-400" :
                      v.score === "Normal" ? "bg-yellow-900/50 text-yellow-400" :
                      "bg-gray-800 text-gray-500"
                    }`}>
                      {v.score}
                    </span>
                  ) : "-"}
                </td>
                <td className="px-3 py-3 text-center hidden lg:table-cell">
                  {v.query ? (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{v.query}</span>
                  ) : "-"}
                </td>
                <td className="px-3 py-3 text-center text-gray-600 text-xs whitespace-nowrap hidden lg:table-cell">
                  {v.saved_at?.split("T")[0] || ""}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => handleDelete(v.video_id)}
                    disabled={deleting === v.video_id}
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs p-1 rounded"
                    title="삭제"
                  >
                    {deleting === v.video_id ? "..." : "🗑"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
