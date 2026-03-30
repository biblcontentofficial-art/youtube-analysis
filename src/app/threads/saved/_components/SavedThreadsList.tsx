"use client";

import { useState, useMemo } from "react";
import type { SavedThread } from "@/lib/db";

interface Props {
  initialThreads: SavedThread[];
}

function fmtNum(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

type SortKey = "saved" | "likes" | "reposts" | "viral";

export default function SavedThreadsList({ initialThreads }: Props) {
  const [threads, setThreads] = useState(initialThreads);
  const [search, setSearch] = useState("");
  const [queryFilter, setQueryFilter] = useState<string>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("saved");
  const [sortAsc, setSortAsc] = useState(false);
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  // 키워드 목록
  const queries = useMemo(() => {
    const set = new Set<string>();
    for (const t of threads) if (t.query) set.add(t.query);
    return Array.from(set).sort();
  }, [threads]);

  // 즐겨찾기 토글
  async function handleToggleFavorite(postId: string, current: boolean) {
    await fetch("/api/threads/saved", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, is_favorite: !current }),
    });
    setThreads((prev) =>
      prev.map((t) => (t.post_id === postId ? { ...t, is_favorite: !current } : t))
    );
  }

  // 메모 저장
  async function handleSaveMemo(postId: string) {
    await fetch("/api/threads/saved", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, memo: memoText }),
    });
    setThreads((prev) =>
      prev.map((t) => (t.post_id === postId ? { ...t, memo: memoText || null } : t))
    );
    setEditingMemo(null);
    setMemoText("");
  }

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let arr = [...threads];

    // 즐겨찾기 필터
    if (favOnly) {
      arr = arr.filter((t) => t.is_favorite);
    }

    // 키워드 필터
    if (queryFilter !== "all") {
      arr = arr.filter((t) => t.query === queryFilter);
    }

    // 텍스트 검색
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (t) =>
          (t.text ?? "").toLowerCase().includes(q) ||
          (t.username ?? "").toLowerCase().includes(q) ||
          (t.memo ?? "").toLowerCase().includes(q)
      );
    }

    // 정렬
    const dir = sortAsc ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "likes": return (a.like_count - b.like_count) * dir;
        case "reposts": return (a.repost_count - b.repost_count) * dir;
        case "viral": return (a.viral_score - b.viral_score) * dir;
        default: return (new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime()) * dir;
      }
    });
    return arr;
  }, [threads, search, queryFilter, sortKey, sortAsc]);

  // 통계
  const stats = useMemo(() => {
    const total = threads.length;
    const avgViral = total > 0 ? Math.round(threads.reduce((s, t) => s + t.viral_score, 0) / total) : 0;
    const goodCount = threads.filter((t) => t.viral_score >= 60).length;
    return { total, avgViral, goodCount };
  }, [threads]);

  // CSV 내보내기
  function handleExportCsv() {
    const BOM = "\uFEFF";
    const header = "게시물,@계정,팔로워,좋아요,리포스트,댓글,바이럴점수,게시일,링크\n";
    const rows = filtered.map((t) => {
      const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
      return [
        esc((t.text ?? "").replace(/\n/g, " ").slice(0, 100)),
        esc(t.username ?? ""),
        t.followers_count,
        t.like_count,
        t.repost_count,
        t.replies_count,
        t.viral_score,
        fmtDate(t.published_at),
        esc(t.permalink ?? ""),
      ].join(",");
    });

    const csv = BOM + header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibl_saved_threads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 삭제
  async function handleDelete(postId: string) {
    await fetch("/api/threads/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    setThreads((prev) => prev.filter((t) => t.post_id !== postId));
  }

  async function handleClearAll() {
    if (!confirm(`수집한 ${threads.length}개 게시물을 모두 삭제할까요?`)) return;
    await fetch("/api/threads/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setThreads([]);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sortArrow = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  if (threads.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-400 text-sm">아직 수집한 게시물이 없어요</p>
        <a href="/threads" className="text-xs text-teal-400 hover:text-teal-300 mt-2 inline-block">
          스레드 검색하러 가기 →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">수집 게시물</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-teal-400">{stats.avgViral}</div>
          <div className="text-xs text-gray-500">평균 바이럴</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-yellow-400">{stats.goodCount}</div>
          <div className="text-xs text-gray-500">60점 이상</div>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="게시물 검색..."
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-teal-500 flex-1 min-w-[140px]"
        />

        <button
          onClick={() => setFavOnly(!favOnly)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition ${
            favOnly
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          {favOnly ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
        </button>

        {queries.length > 0 && (
          <select
            value={queryFilter}
            onChange={(e) => setQueryFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none"
          >
            <option value="all">전체 키워드</option>
            {queries.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        )}

        <button
          onClick={handleExportCsv}
          className="text-xs bg-teal-500 hover:bg-teal-400 text-white px-3 py-1.5 rounded-lg transition"
        >
          CSV 내보내기
        </button>

        <button
          onClick={handleClearAll}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 transition"
        >
          전체 삭제
        </button>

        <span className="text-xs text-gray-600 ml-auto">{filtered.length}개</span>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_90px_70px_70px_70px_70px_70px_40px] px-4 py-2 text-[10px] text-gray-600 border-b border-gray-800/50">
          <span>게시물</span>
          <span className="text-right">@계정</span>
          <button onClick={() => toggleSort("likes")} className="text-right hover:text-gray-400">좋아요{sortArrow("likes")}</button>
          <button onClick={() => toggleSort("reposts")} className="text-right hover:text-gray-400">리포스트{sortArrow("reposts")}</button>
          <span className="text-right">댓글</span>
          <button onClick={() => toggleSort("viral")} className="text-right hover:text-gray-400">바이럴{sortArrow("viral")}</button>
          <button onClick={() => toggleSort("saved")} className="text-right hover:text-gray-400">저장일{sortArrow("saved")}</button>
          <span />
        </div>

        <div className="divide-y divide-gray-800/50">
          {filtered.map((t) => (
            <div
              key={t.post_id}
              className="grid grid-cols-1 md:grid-cols-[1fr_90px_70px_70px_70px_70px_70px_40px] px-4 py-3 items-center gap-1 hover:bg-gray-800/30 transition"
            >
              <div className="min-w-0">
                <a
                  href={t.permalink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-white line-clamp-1 transition"
                >
                  {t.text || <span className="text-gray-600 italic">(미디어)</span>}
                </a>
                {t.query && (
                  <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                    {t.query}
                  </span>
                )}
                {/* 메모 */}
                {editingMemo === t.post_id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="text"
                      value={memoText}
                      onChange={(e) => setMemoText(e.target.value)}
                      placeholder="메모 입력..."
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white outline-none w-48"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveMemo(t.post_id); if (e.key === "Escape") setEditingMemo(null); }}
                    />
                    <button onClick={() => handleSaveMemo(t.post_id)} className="text-[10px] text-teal-400">저장</button>
                    <button onClick={() => setEditingMemo(null)} className="text-[10px] text-gray-600">취소</button>
                  </div>
                ) : t.memo ? (
                  <button
                    onClick={() => { setEditingMemo(t.post_id); setMemoText(t.memo ?? ""); }}
                    className="text-[10px] text-gray-500 hover:text-gray-300 mt-0.5 block transition"
                  >
                    📝 {t.memo}
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditingMemo(t.post_id); setMemoText(""); }}
                    className="text-[10px] text-gray-700 hover:text-gray-500 mt-0.5 block transition"
                  >
                    + 메모
                  </button>
                )}
              </div>
              <div className="hidden md:block text-right text-xs text-gray-500 truncate">
                @{t.username}
              </div>
              <div className="hidden md:block text-right text-sm text-gray-400">{fmtNum(t.like_count)}</div>
              <div className="hidden md:block text-right text-sm text-gray-400">{fmtNum(t.repost_count)}</div>
              <div className="hidden md:block text-right text-sm text-gray-400">{fmtNum(t.replies_count)}</div>
              <div className={`hidden md:block text-right text-sm font-medium ${t.viral_score >= 60 ? "text-teal-400" : t.viral_score >= 30 ? "text-yellow-400" : "text-gray-500"}`}>
                {t.viral_score}
              </div>
              <div className="hidden md:block text-right text-xs text-gray-600">{fmtDate(t.saved_at)}</div>
              <div className="hidden md:flex justify-end gap-1">
                <button
                  onClick={() => handleToggleFavorite(t.post_id, t.is_favorite)}
                  className={`transition text-sm ${t.is_favorite ? "text-yellow-400" : "text-gray-700 hover:text-yellow-400"}`}
                  title="즐겨찾기"
                >
                  {t.is_favorite ? "★" : "☆"}
                </button>
                <button
                  onClick={() => handleDelete(t.post_id)}
                  className="text-gray-700 hover:text-red-400 transition text-xs"
                  title="삭제"
                >
                  ✕
                </button>
              </div>

              {/* 모바일 */}
              <div className="flex md:hidden items-center gap-3 text-xs text-gray-600 mt-1">
                <span>@{t.username}</span>
                <span>바이럴 {t.viral_score}</span>
                <span>{fmtDate(t.saved_at)}</span>
                <button onClick={() => handleDelete(t.post_id)} className="ml-auto text-gray-700 hover:text-red-400">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
