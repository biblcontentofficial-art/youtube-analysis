"use client";

import { useState, useMemo } from "react";

interface PostInsight {
  id: string;
  text: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  engagement_rate: number;
}

type SortKey = "timestamp" | "views" | "likes" | "replies" | "reposts" | "quotes" | "engagement_rate";

interface Props {
  posts: PostInsight[];
}

function fmt(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function PostPerformanceTable({ posts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = posts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.text.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const va = sortKey === "timestamp" ? new Date(a.timestamp).getTime() : (a[sortKey] as number);
      const vb = sortKey === "timestamp" ? new Date(b.timestamp).getTime() : (b[sortKey] as number);
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [posts, sortKey, sortDir, search]);

  const handleCsvDownload = () => {
    const BOM = "\uFEFF";
    const header = "콘텐츠,조회수,좋아요,댓글,리포스트,인용,참여율,게시일,링크\n";
    const rows = filtered
      .map(
        (p) =>
          `"${p.text.replace(/"/g, '""').slice(0, 200)}",${p.views},${p.likes},${p.replies},${p.reposts},${p.quotes},${p.engagement_rate}%,${p.timestamp.split("T")[0]},${p.permalink}`
      )
      .join("\n");
    const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibl_threads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cols: { key: SortKey; label: string; icon: string }[] = [
    { key: "views", label: "조회수", icon: "eye" },
    { key: "likes", label: "좋아요", icon: "heart" },
    { key: "replies", label: "댓글", icon: "comment" },
    { key: "reposts", label: "리포스트", icon: "repost" },
    { key: "quotes", label: "인용", icon: "quote" },
    { key: "engagement_rate", label: "참여율", icon: "%" },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-white">게시물</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="텍스트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 w-40"
          />
          <button
            onClick={handleCsvDownload}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="text-left px-4 py-3 font-medium min-w-[200px]">콘텐츠 / 날짜</th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="text-right px-3 py-3 font-medium cursor-pointer hover:text-gray-300 transition whitespace-nowrap"
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}
                  {sortKey === c.key && (
                    <span className="ml-1 text-teal-400">
                      {sortDir === "desc" ? "v" : "^"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
              >
                <td className="px-4 py-3">
                  <div className="text-white line-clamp-2 text-xs leading-relaxed">
                    {p.text.slice(0, 120) || "(이미지/영상)"}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600 text-[10px]">
                      {new Date(p.timestamp).toLocaleDateString("ko-KR")}
                    </span>
                    <a
                      href={p.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-teal-400 transition"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </td>
                <td className="text-right px-3 py-3 text-gray-400">{fmt(p.views)}</td>
                <td className="text-right px-3 py-3 text-gray-400">{fmt(p.likes)}</td>
                <td className="text-right px-3 py-3 text-gray-400">{fmt(p.replies)}</td>
                <td className="text-right px-3 py-3 text-gray-400">{fmt(p.reposts)}</td>
                <td className="text-right px-3 py-3 text-gray-400">{fmt(p.quotes)}</td>
                <td className="text-right px-3 py-3">
                  <span
                    className={
                      p.engagement_rate >= 5
                        ? "text-teal-400"
                        : p.engagement_rate >= 2
                        ? "text-yellow-400"
                        : "text-gray-500"
                    }
                  >
                    {p.engagement_rate}%
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-600 py-10">
                  게시물이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
