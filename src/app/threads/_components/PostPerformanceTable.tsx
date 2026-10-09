"use client";

/**
 * 게시물 성과 표. 앱 표 부품(table.ts) · 정렬은 머리 칸 안 버튼 + aria-sort · 숫자는 lib/format.
 * 근거: DESIGN.md 6.10 표 · 3.1 평가 값(참여율 5% 이상 positive, 2% 이상 fg-2, 그 아래 fg-3. 흰색 쓰지 않음)
 *
 * - 768 미만은 콘텐츠 · 조회수 · 참여율 열만 두고, 나머지 숫자는 콘텐츠 아래 한 줄로 보여 준다.
 */
import { useState, useMemo, useId } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { INPUT } from "@/components/ui/field";
import { NUM, ROW, TABLE, TD, TH, TH_SORT, TH_SORT_ACTIVE } from "@/components/ui/table";
import { formatCompactKo } from "@/lib/format";

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

function engagementTone(rate: number): string {
  return rate >= 5 ? "text-positive" : rate >= 2 ? "text-fg-2" : "text-fg-3";
}

export default function PostPerformanceTable({ posts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const searchId = useId();

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
    const BOM = "﻿";
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

  /** mobile: 768 미만에도 보이는 열 */
  const cols: { key: SortKey; label: string; mobile?: boolean; width: string }[] = [
    { key: "views", label: "조회수", mobile: true, width: "w-20 md:w-24" },
    { key: "likes", label: "좋아요", width: "w-20" },
    { key: "replies", label: "댓글", width: "w-16" },
    { key: "reposts", label: "리포스트", width: "w-20" },
    { key: "quotes", label: "인용", width: "w-16" },
    { key: "engagement_rate", label: "참여율", mobile: true, width: "w-16 md:w-20" },
  ];

  const ariaSort = (key: SortKey) =>
    sortKey === key ? (sortDir === "desc" ? "descending" : "ascending") : undefined;

  // 컴포넌트가 아니라 함수로 그린다(렌더마다 새 컴포넌트가 되면 버튼이 다시 만들어져 포커스를 잃는다)
  const sortButton = (k: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(k)} className={cx(TH_SORT, sortKey === k && TH_SORT_ACTIVE)}>
      {label}
      {sortKey === k && <span aria-hidden="true">{sortDir === "desc" ? "↓" : "↑"}</span>}
    </button>
  );

  return (
    <section aria-labelledby="threads-posts">
      {/* 머리: 제목 · 검색 · CSV */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="threads-posts" className="text-ui font-semibold text-fg">
          게시물 <span className="tnum text-caption font-normal text-fg-3">{filtered.length}개</span>
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor={searchId} className="sr-only">게시물 텍스트 검색</label>
          <input
            id={searchId}
            type="search"
            placeholder="텍스트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cx(INPUT, "min-w-0 flex-1 sm:w-56 sm:flex-none")}
          />
          <button
            type="button"
            onClick={handleCsvDownload}
            disabled={filtered.length === 0}
            className={buttonClass({ variant: "secondary" })}
          >
            CSV
          </button>
        </div>
      </div>

      <table className={cx(TABLE, "mt-3")}>
        <caption className="sr-only">게시물 성과</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort("timestamp")} className={cx(TH, "pr-4")}>
              {sortButton("timestamp", "콘텐츠 / 날짜")}
            </th>
            {cols.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={ariaSort(c.key)}
                className={cx(TH, c.width, "pr-3 text-right", !c.mobile && "hidden md:table-cell")}
              >
                {sortButton(c.key, c.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className={ROW}>
              <td className={cx(TD, "pr-4")}>
                <a
                  href={p.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-body-sm text-fg-1 underline-offset-4 hover:underline"
                >
                  {p.text.slice(0, 120) || "(이미지/영상)"}
                  <span className="sr-only">(새 창)</span>
                </a>
                <p className="tnum mt-1 text-caption text-fg-3">
                  {new Date(p.timestamp).toLocaleDateString("ko-KR")}
                </p>
                {/* 768 미만: 숨긴 열의 숫자를 한 줄로 */}
                <p className="tnum mt-0.5 flex flex-wrap gap-x-2 text-caption text-fg-3 md:hidden">
                  <span>좋아요 {formatCompactKo(p.likes)}</span>
                  <span>댓글 {formatCompactKo(p.replies)}</span>
                  <span>리포스트 {formatCompactKo(p.reposts)}</span>
                  <span>인용 {formatCompactKo(p.quotes)}</span>
                </p>
              </td>
              <td className={cx(TD, NUM, "pr-3 text-body-sm font-bold text-fg")}>{formatCompactKo(p.views)}</td>
              <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(p.likes)}</td>
              <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(p.replies)}</td>
              <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(p.reposts)}</td>
              <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(p.quotes)}</td>
              <td className={cx(TD, NUM, "pr-3 text-body-sm font-semibold", engagementTone(p.engagement_rate))}>
                {p.engagement_rate}%
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="py-10 text-center text-body-sm text-fg-3">
                게시물이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
