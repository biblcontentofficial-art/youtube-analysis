"use client";

/**
 * 스레드 수집함 목록. 앱 표 부품(table.ts) + 즐겨찾기 별(caution, aria-pressed, 44px) + 확인창(useConfirm, destructive).
 * 근거: DESIGN.md 6.10 표 · 6.6 칩 · 6.9 입력 · 6.11 확인창 · 6.20 빈 상태 · 3.1 평가 값(바이럴 60 이상 positive, 30 이상 fg-2, 그 아래 fg-3)
 *
 * - 즐겨찾기 필터는 누르는 즉시 목록에 반영된다(필터 계산 의존성에 favOnly).
 * - 즐겨찾기·삭제 버튼은 모든 폭에서 보인다(768 미만 44px). 개별 삭제·전체 삭제는 확인창을 거친다.
 * - 정렬은 머리 칸 안 버튼 + aria-sort. 숫자는 lib/format.
 */
import { useState, useMemo, useId } from "react";
import type { SavedThread } from "@/lib/db";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { buttonClass, cx } from "@/components/ui/button";
import { CHIP } from "@/components/ui/chip";
import { INPUT } from "@/components/ui/field";
import { ChevronDownIcon } from "@/components/ui/icons";
import { NUM, ROW, TABLE, TD, TH, TH_SORT, TH_SORT_ACTIVE } from "@/components/ui/table";
import { formatCompactKo } from "@/lib/format";

interface Props {
  initialThreads: SavedThread[];
}

// 서버(UTC)와 브라우저의 날짜가 자정 근처에서 갈리지 않게 한국 시간으로 고정한다
const DATE_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const parts = DATE_PARTS.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

function viralTone(score: number): string {
  return score >= 60 ? "text-positive" : score >= 30 ? "text-fg-2" : "text-fg-3";
}

type SortKey = "saved" | "likes" | "reposts" | "viral";

const SELECT =
  "h-11 w-full appearance-none rounded-control border border-line bg-surface pl-3 pr-9 text-body-sm text-fg transition-colors duration-150 hover:border-line-hover max-md:text-base sm:w-auto";

/** 아이콘만 있는 행 동작 버튼: 768 미만 44px · 그 이상 36px · 터치 기기 44px */
const ICON_BTN =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-control transition-colors duration-150 hover:bg-surface-2 md:size-9 pointer-coarse:size-11";

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("shrink-0", className)}
    >
      <path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.13L12 17.03l-5.5 2.9 1.05-6.13L3.1 9.47l6.15-.9z" />
    </svg>
  );
}

export default function SavedThreadsList({ initialThreads }: Props) {
  const askConfirm = useConfirm();
  const searchId = useId();
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
  }, [threads, search, queryFilter, favOnly, sortKey, sortAsc]);

  // 통계
  const stats = useMemo(() => {
    const total = threads.length;
    const avgViral = total > 0 ? Math.round(threads.reduce((s, t) => s + t.viral_score, 0) / total) : 0;
    const goodCount = threads.filter((t) => t.viral_score >= 60).length;
    return { total, avgViral, goodCount };
  }, [threads]);

  // CSV 내보내기
  function handleExportCsv() {
    const BOM = "﻿";
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
  async function handleDelete(t: SavedThread) {
    const preview = (t.text ?? "").replace(/\s+/g, " ").slice(0, 40);
    const ok = await askConfirm({
      message: "이 게시물을 수집함에서 삭제할까요?",
      subMessage: preview ? `"${preview}${(t.text ?? "").length > 40 ? "…" : ""}"` : undefined,
      confirmText: "삭제",
      destructive: true,
    });
    if (!ok) return;
    await fetch("/api/threads/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: t.post_id }),
    });
    setThreads((prev) => prev.filter((x) => x.post_id !== t.post_id));
  }

  async function handleClearAll() {
    const ok = await askConfirm({
      message: `수집한 ${threads.length}개 게시물을 모두 삭제할까요?`,
      confirmText: "모두 삭제",
      destructive: true,
    });
    if (!ok) return;
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

  const ariaSort = (key: SortKey) =>
    sortKey === key ? (sortAsc ? "ascending" : "descending") : undefined;

  // 컴포넌트가 아니라 함수로 그린다(렌더마다 새 컴포넌트가 되면 버튼이 다시 만들어져 포커스를 잃는다)
  const sortButton = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className={cx(TH_SORT, sortKey === key && TH_SORT_ACTIVE)}>
      {label}
      {sortKey === key && <span aria-hidden="true">{sortAsc ? "↑" : "↓"}</span>}
    </button>
  );

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8">
        <div>
          <p className="text-ui font-semibold text-fg">아직 수집한 게시물이 없어요</p>
        </div>
        <a href="/threads" className={buttonClass({ variant: "secondary" })}>
          스레드 분석으로 <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  return (
    // 768 미만: 카카오 상담 버튼(오른쪽 아래 고정) 높이만큼 아래 여백을 둬 마지막 행의 버튼을 버튼 위로 올릴 수 있게 한다
    <div className="max-md:pb-24">
      {/* 통계 */}
      <dl className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { label: "수집 게시물", value: stats.total.toLocaleString("ko-KR") },
          { label: "평균 바이럴", value: String(stats.avgViral) },
          { label: "60점 이상", value: stats.goodCount.toLocaleString("ko-KR") },
        ].map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-1 rounded-card border border-line bg-surface p-4">
            <dt className="text-caption text-fg-3">{s.label}</dt>
            <dd className="tnum text-lead font-extrabold leading-tight text-fg md:text-h4">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* 컨트롤 */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line py-2.5">
        <label htmlFor={searchId} className="sr-only">게시물 검색</label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="게시물 검색..."
          className={cx(INPUT, "min-w-[140px] flex-1 sm:w-64 sm:flex-none")}
        />

        <button
          type="button"
          aria-pressed={favOnly}
          onClick={() => setFavOnly(!favOnly)}
          className={CHIP}
        >
          <StarIcon filled={favOnly} className={favOnly ? "text-caution" : "text-fg-3"} />
          즐겨찾기
        </button>

        {queries.length > 0 && (
          <label className="relative flex w-full items-center sm:w-auto">
            <span className="sr-only">검색 키워드</span>
            <select value={queryFilter} onChange={(e) => setQueryFilter(e.target.value)} className={SELECT}>
              <option value="all">전체 키워드</option>
              {queries.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
            <ChevronDownIcon size={16} className="pointer-events-none absolute right-2.5 text-fg-3" />
          </label>
        )}

        <span className="tnum text-caption text-fg-3 sm:ml-auto">{filtered.length}개</span>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className={cx(buttonClass({ variant: "secondary", size: "sm" }), "pointer-coarse:h-11")}
          >
            CSV 내보내기
          </button>
          <button
            type="button"
            onClick={() => void handleClearAll()}
            className={cx(buttonClass({ variant: "danger", size: "sm" }), "pointer-coarse:h-11")}
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* 표 */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-body-sm text-fg-3">
          {favOnly ? "즐겨찾기한 게시물이 없습니다." : "조건에 맞는 게시물이 없습니다."}
        </p>
      ) : (
        <table className={cx(TABLE, "mt-2")}>
          <caption className="sr-only">수집한 스레드 게시물</caption>
          <thead>
            <tr>
              <th scope="col" className={cx(TH, "pr-4")}>게시물</th>
              <th scope="col" className={cx(TH, "hidden w-28 pr-3 text-right lg:table-cell")}>@계정</th>
              <th scope="col" aria-sort={ariaSort("likes")} className={cx(TH, "hidden w-20 pr-3 text-right md:table-cell")}>
                {sortButton("likes", "좋아요")}
              </th>
              <th scope="col" aria-sort={ariaSort("reposts")} className={cx(TH, "hidden w-20 pr-3 text-right md:table-cell")}>
                {sortButton("reposts", "리포스트")}
              </th>
              <th scope="col" className={cx(TH, "hidden w-16 pr-3 text-right md:table-cell")}>댓글</th>
              <th scope="col" aria-sort={ariaSort("viral")} className={cx(TH, "hidden w-20 pr-3 text-right md:table-cell")}>
                {sortButton("viral", "바이럴")}
              </th>
              <th scope="col" aria-sort={ariaSort("saved")} className={cx(TH, "hidden w-24 pr-3 text-right md:table-cell")}>
                {sortButton("saved", "저장일")}
              </th>
              <th scope="col" className={cx(TH, "w-24 md:w-20")}><span className="sr-only">즐겨찾기 · 삭제</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.post_id} className={ROW}>
                <td className={cx(TD, "pr-4")}>
                  <a
                    href={t.permalink ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-body-sm text-fg-1 underline-offset-4 hover:underline md:line-clamp-1"
                  >
                    {t.text || <span className="italic text-fg-3">(미디어)</span>}
                    <span className="sr-only">(새 창)</span>
                  </a>
                  {t.query && (
                    <span className="mt-1 inline-flex max-w-full items-center truncate rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">
                      {t.query}
                    </span>
                  )}
                  {/* 숨긴 열을 한 줄로: @계정은 1024 미만, 나머지는 768 미만 */}
                  <p className="tnum mt-1 flex flex-wrap gap-x-2 text-caption text-fg-3 lg:hidden">
                    <span>@{t.username}</span>
                    <span className="md:hidden">좋아요 {formatCompactKo(t.like_count)}</span>
                    <span className={cx("md:hidden", viralTone(t.viral_score))}>바이럴 {t.viral_score}</span>
                    <span className="md:hidden">{fmtDate(t.saved_at)}</span>
                  </p>
                  {/* 메모 */}
                  {editingMemo === t.post_id ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="메모 입력..."
                        aria-label="메모"
                        className="h-9 w-48 rounded-control border border-line-strong bg-surface px-2.5 text-caption text-fg placeholder:text-fg-3 focus-visible:border-accent max-md:text-base"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveMemo(t.post_id); if (e.key === "Escape") setEditingMemo(null); }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveMemo(t.post_id)}
                        className={cx(buttonClass({ variant: "ghost", size: "sm" }), "px-2.5 text-caption text-fg")}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMemo(null)}
                        className={cx(buttonClass({ variant: "ghost", size: "sm" }), "px-2.5 text-caption")}
                      >
                        취소
                      </button>
                    </div>
                  ) : t.memo ? (
                    <button
                      type="button"
                      onClick={() => { setEditingMemo(t.post_id); setMemoText(t.memo ?? ""); }}
                      className="mt-1 block text-left text-caption text-fg-2 transition-colors hover:text-fg"
                    >
                      <span className="text-fg-3">메모 · </span>{t.memo}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingMemo(t.post_id); setMemoText(""); }}
                      className="mt-1 block text-caption text-fg-3 transition-colors hover:text-fg"
                    >
                      + 메모
                    </button>
                  )}
                </td>
                <td className={cx(TD, "hidden truncate pr-3 text-right text-caption text-fg-3 lg:table-cell")}>
                  @{t.username}
                </td>
                <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(t.like_count)}</td>
                <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(t.repost_count)}</td>
                <td className={cx(TD, NUM, "hidden pr-3 text-body-sm text-fg-2 md:table-cell")}>{formatCompactKo(t.replies_count)}</td>
                <td className={cx(TD, NUM, "hidden pr-3 text-body-sm font-semibold md:table-cell", viralTone(t.viral_score))}>
                  {t.viral_score}
                </td>
                <td className={cx(TD, NUM, "hidden whitespace-nowrap pr-3 text-caption text-fg-3 md:table-cell")}>{fmtDate(t.saved_at)}</td>
                <td className={cx(TD, "text-right")}>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      aria-pressed={t.is_favorite}
                      aria-label="즐겨찾기"
                      title="즐겨찾기"
                      onClick={() => handleToggleFavorite(t.post_id, t.is_favorite)}
                      className={cx(ICON_BTN, t.is_favorite ? "text-caution" : "text-fg-3 hover:text-caution")}
                    >
                      <StarIcon filled={t.is_favorite} />
                    </button>
                    <button
                      type="button"
                      aria-label="삭제"
                      title="삭제"
                      onClick={() => void handleDelete(t)}
                      className={cx(ICON_BTN, "text-fg-3 hover:text-negative")}
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
