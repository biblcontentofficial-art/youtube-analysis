"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 썸네일·채널 아이콘 원본 URL */
/**
 * 수집한 영상 목록 (DESIGN 6.10 표 · 6.13 토스트 · 6.20 빈 상태, R18)
 *
 * - 통계는 만·억 + fg 800, 기준(전체 · 최근 200개)을 캡션으로 적는다. 서버는 최근 200개까지만 내려 준다(lib/db getSavedVideos).
 * - 삭제는 성공 응답을 받은 뒤에만 행을 지운다. 실패하면 행을 되돌리고 오류 토스트(다시 시도).
 * - 전체 삭제는 확인창(useConfirm, destructive)에 실제 범위를 적는다. 필터와 상관없이 수집한 영상 전체가 지워진다.
 * - 목록은 50개씩 보여 주고 '더보기'로 늘린다(받은 목록 안에서만, 요청 없음).
 */
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SavedVideo } from "@/lib/db";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { cx } from "@/components/ui/button";
import { INPUT } from "@/components/ui/field";
import { ChevronDownIcon } from "@/components/ui/icons";
import { NUM, ROW, TABLE, TD, TH } from "@/components/ui/table";
import { formatCompactKo } from "@/lib/format";
import { ActionToast, BTN_BASE, BTN_SECONDARY, type ToastData } from "@/app/search/_components/SelectionBar";

interface Props {
  initialVideos: SavedVideo[];
}

type SortOption = "saved_at_desc" | "saved_at_asc" | "view_count_desc";

/** 서버가 내려 주는 최대 개수(lib/db getSavedVideos 기본 limit) */
const SERVER_LIMIT = 200;
const PAGE_SIZE = 50;

const SELECT =
  "h-11 w-full appearance-none rounded-control border border-line bg-surface pl-3 pr-9 text-body-sm text-fg transition-colors duration-150 hover:border-line-hover max-md:text-base sm:w-auto";

function SelectBox({ label, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="relative flex w-full items-center sm:w-auto">
      <span className="sr-only">{label}</span>
      <select {...rest} className={SELECT}>
        {children}
      </select>
      <ChevronDownIcon size={16} className="pointer-events-none absolute right-2.5 text-fg-3" />
    </label>
  );
}

export default function SavedVideoList({ initialVideos }: Props) {
  const askConfirm = useConfirm();
  const searchId = useId();
  const [videos, setVideos] = useState<SavedVideo[]>(initialVideos);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("saved_at_desc");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastSeq = useRef(0);

  const showToast = (t: Omit<ToastData, "id">) => {
    toastSeq.current += 1;
    setToast({ ...t, id: toastSeq.current });
  };

  // 검색어·필터·정렬이 바뀌면 처음 50개부터
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, filterQuery, sortBy]);

  const uniqueQueries = [...new Set(videos.map((v) => v.query).filter(Boolean))] as string[];

  const handleExportCsv = () => {
    const rows = [
      ["제목", "채널", "조회수", "구독자", "업로드일", "검색키워드", "수집일", "YouTube URL"],
      ...filtered.map((v) => [
        `"${(v.title || "").replace(/"/g, '""')}"`,
        `"${(v.channel_title || "").replace(/"/g, '""')}"`,
        v.view_count ?? "",
        v.subscriber_count ?? "",
        v.published_at?.slice(0, 10) ?? "",
        `"${(v.query || "").replace(/"/g, '""')}"`,
        v.saved_at?.slice(0, 10) ?? "",
        `"https://youtube.com/watch?v=${v.video_id}"`,
      ]),
    ];
    const csv = "﻿" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibl_saved_videos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = videos
    .filter((v) => {
      const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.channel_title?.toLowerCase().includes(search.toLowerCase());
      const matchQuery = !filterQuery || v.query === filterQuery;
      return matchSearch && matchQuery;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "saved_at_asc":
          return (a.saved_at ?? "").localeCompare(b.saved_at ?? "");
        case "view_count_desc":
          return (b.view_count ?? 0) - (a.view_count ?? 0);
        default: // saved_at_desc
          return (b.saved_at ?? "").localeCompare(a.saved_at ?? "");
      }
    });
  const shown = filtered.slice(0, visible);

  // 통계 (받은 목록 전체 기준. 200개를 넘으면 최근 200개 기준)
  const totalViews = videos.reduce((sum, v) => sum + (v.view_count ?? 0), 0);
  const avgViews = Math.round(totalViews / Math.max(videos.length, 1));
  const truncated = videos.length >= SERVER_LIMIT;

  // 단일 삭제: 응답이 성공일 때만 행을 지운다. 그 전까지 행은 흐리게 두고, 실패하면 되돌린 뒤 알린다
  const handleDelete = async (videoId: string) => {
    setDeleting(videoId);
    let ok = false;
    try {
      const res = await fetch("/api/saved-videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    } finally {
      setDeleting(null);
    }
    if (ok) {
      setVideos((prev) => prev.filter((v) => v.video_id !== videoId));
    } else {
      showToast({
        tone: "error",
        message: "삭제 중 오류가 발생했습니다.",
        action: { label: "다시 시도", onClick: () => void handleDelete(videoId) },
      });
    }
  };

  const handleClearAll = async () => {
    const ok = await askConfirm({
      message: truncated
        ? "수집한 영상을 모두 삭제하시겠습니까?"
        : `수집한 영상 ${videos.length}개를 모두 삭제하시겠습니까?`,
      subMessage: truncated
        ? `화면에 보이는 최근 ${SERVER_LIMIT}개를 포함해 지금까지 수집한 영상 전체가 삭제됩니다. 검색어·키워드 필터와 상관없이 지워지며 되돌릴 수 없습니다.`
        : "검색어·키워드 필터와 상관없이 수집한 영상 전체가 삭제되며 되돌릴 수 없습니다.",
      confirmText: "전체 삭제",
      destructive: true,
    });
    if (!ok) return;
    let done = false;
    try {
      const res = await fetch("/api/saved-videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      done = res.ok;
    } catch {
      done = false;
    }
    if (done) setVideos([]);
    else showToast({ tone: "error", message: "삭제 중 오류가 발생했습니다.", action: { label: "다시 시도", onClick: () => void handleClearAll() } });
  };

  const toastLayer = <ActionToast toast={toast} onDismiss={() => setToast(null)} />;

  if (videos.length === 0) {
    return (
      <>
        <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8">
          <div>
            <p className="text-ui font-semibold text-fg">수집한 영상이 없어요</p>
            <p className="mt-1 text-body-sm text-fg-3">영상 찾기에서 영상을 수집하면 여기서 확인할 수 있습니다</p>
          </div>
          <Link href="/search" className={cx(BTN_SECONDARY, "h-11 px-5 text-body-sm")}>
            영상 찾기
          </Link>
        </div>
        {toastLayer}
      </>
    );
  }

  return (
    // 768 미만: 카카오 상담 버튼(오른쪽 아래 고정) 높이만큼 아래 여백을 둬 마지막 행의 삭제 버튼까지 버튼 위로 올릴 수 있게 한다
    <div className="max-md:pb-24">
      {/* 통계 요약 */}
      <dl className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { label: "수집된 영상", value: `${videos.length.toLocaleString()}개` },
          { label: "총 조회수 합계", value: formatCompactKo(totalViews) },
          { label: "평균 조회수", value: formatCompactKo(avgViews) },
        ].map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-1 rounded-card border border-line bg-surface p-4">
            <dt className="text-caption text-fg-3">{s.label}</dt>
            <dd className="tnum whitespace-nowrap text-lead font-extrabold leading-tight text-fg md:text-h4">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-caption text-fg-3">
        {truncated ? `최근 ${SERVER_LIMIT}개 표시 중 · 통계도 이 ${SERVER_LIMIT}개 기준` : "전체 기준"}
      </p>

      {/* 필터 / 검색 바 */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-line py-2.5">
        <label htmlFor={searchId} className="sr-only">제목 또는 채널 검색</label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목 또는 채널 검색..."
          className={cx(INPUT, "sm:w-64")}
        />
        {uniqueQueries.length > 0 && (
          <SelectBox label="검색 키워드" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)}>
            <option value="">전체 키워드</option>
            {uniqueQueries.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </SelectBox>
        )}
        <SelectBox label="정렬" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
          <option value="saved_at_desc">최신 수집순</option>
          <option value="saved_at_asc">오래된 수집순</option>
          <option value="view_count_desc">조회수 높은순</option>
        </SelectBox>
        <span className="tnum text-caption text-fg-3 sm:ml-auto">총 {filtered.length}개</span>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className={cx(BTN_SECONDARY, "h-9 px-3 text-body-sm pointer-coarse:h-11")}
          >
            CSV 내보내기
          </button>
          <button
            type="button"
            onClick={() => void handleClearAll()}
            className={cx(BTN_BASE, "h-9 border border-negative/40 px-3 text-body-sm font-semibold text-negative hover:border-negative hover:bg-surface-2 pointer-coarse:h-11")}
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* 표 */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-body-sm text-fg-3">조건에 맞는 영상이 없습니다.</p>
      ) : (
        <table className={cx(TABLE, "mt-2")}>
          <caption className="sr-only">수집한 영상</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>영상</th>
              <th scope="col" className={cx(TH, "w-24 pr-4 text-right")}>조회수</th>
              <th scope="col" className={cx(TH, "hidden w-24 pr-4 text-right md:table-cell")}>구독자</th>
              <th scope="col" className={cx(TH, "hidden w-40 lg:table-cell")}>검색 키워드</th>
              <th scope="col" className={cx(TH, "hidden w-28 pr-4 text-right lg:table-cell")}>수집일</th>
              <th scope="col" className={cx(TH, "w-12")}><span className="sr-only">삭제</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((v) => {
              const busy = deleting === v.video_id;
              return (
                <tr key={v.video_id} className={cx(ROW, busy && "opacity-50")} aria-busy={busy || undefined}>
                  <td className={cx(TD, "pr-4")}>
                    <a
                      href={`https://youtube.com/watch?v=${v.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3"
                    >
                      <span className="block w-20 shrink-0 overflow-hidden rounded-control bg-surface-2 md:w-28">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt="" width={160} height={90} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                        ) : (
                          <span className="block aspect-video w-full" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-body-sm font-medium text-fg-1 group-hover:underline group-hover:underline-offset-4 md:text-ui">
                          {v.title}
                          <svg className="ext ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M7 17 17 7M8 7h9v9" />
                          </svg>
                          <span className="sr-only">(새 창)</span>
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-micro text-fg-3">
                          {v.channel_thumbnail && (
                            <img src={v.channel_thumbnail} alt="" width={20} height={20} loading="lazy" decoding="async" className="size-5 shrink-0 rounded-full bg-surface-2 object-cover" />
                          )}
                          <span className="truncate">{v.channel_title}</span>
                        </span>
                      </span>
                    </a>
                  </td>
                  <td className={cx(TD, NUM, "pr-4 text-body-sm font-bold text-fg")} title={v.view_count ? `${v.view_count.toLocaleString()}회` : undefined}>
                    {v.view_count ? `${formatCompactKo(v.view_count)}회` : "-"}
                  </td>
                  <td className={cx(TD, NUM, "hidden pr-4 text-body-sm text-fg-2 md:table-cell")}>
                    {v.subscriber_count || "-"}
                  </td>
                  <td className={cx(TD, "hidden lg:table-cell")}>
                    {v.query ? (
                      <span className="inline-flex max-w-full items-center truncate rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">{v.query}</span>
                    ) : (
                      <span className="text-body-sm text-fg-3">-</span>
                    )}
                  </td>
                  <td className={cx(TD, NUM, "hidden whitespace-nowrap pr-4 text-body-sm text-fg-3 lg:table-cell")}>
                    {v.saved_at?.split("T")[0]?.replace(/-/g, ".") || ""}
                  </td>
                  <td className={cx(TD, "text-right")}>
                    <button
                      type="button"
                      onClick={() => void handleDelete(v.video_id)}
                      disabled={busy}
                      aria-label={`${v.title} 삭제`}
                      title="삭제"
                      className={cx(BTN_BASE, "size-11 text-fg-3 hover:bg-surface-2 hover:text-negative")}
                    >
                      {busy ? (
                        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-fg-2" />
                      ) : (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 50개씩 더보기 (받은 목록 안에서) */}
      {filtered.length > shown.length && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button type="button" onClick={() => setVisible((n) => n + PAGE_SIZE)} className={cx(BTN_SECONDARY, "h-12 px-8 text-ui")}>
            더보기
          </button>
          <p className="tnum text-caption text-fg-3">
            {shown.length}개 표시 · 전체 {filtered.length}개
          </p>
        </div>
      )}

      {toastLayer}
    </div>
  );
}
