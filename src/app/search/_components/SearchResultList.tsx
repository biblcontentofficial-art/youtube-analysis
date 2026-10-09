"use client";

/**
 * 검색 결과 (DESIGN 7.2 4~7행 · 6.10 · 6.25, 시안 design-final/silver/app.html 337~722행)
 *
 *   결과 머리 한 줄: '‘키워드’ 결과 N개' · 길이 필터 · 조회수 합계 · 오늘 N건 | 채널 리포트 Pro · 영상 수집 Pro(1024 이상) · 공유
 *   분석 도구 줄: 키워드 인사이트(상위 영상 패턴 · 연관 키워드) │ 경쟁도 · 제목 패턴(Free 는 잠금 버튼 하나) │ (1024 미만) 리포트 · 수집 · 대행 문의 →
 *   표(1024 이상) / 목록(1024 미만, 위에 전체 선택 + 정렬 선택 상자) → 더보기 + 캡션 → 안내 카드 2장
 *   선택 동작(채널 제거)은 결과 머리가 아니라 화면 아래 선택 바(SelectionBar)에 둔다.
 *
 * 불변 조건 1: dedup · handleLoadMore · 정렬 함수 · key={video.videoId} 는 글자 그대로 둔다(scripts/ux/check-invariants.mjs).
 * 화면은 기존 handleSort · toggleAll · handleLoadMore 를 부르기만 한다. 더보기 실패 안내는 넣지 않는다(보호 구간).
 */
import { useState, useEffect, useCallback, useId, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoListItem, VideoTableRow } from "./VideoCard";
import VideoModal, { type VideoInfoLoader } from "./VideoModal";
import ChannelReport from "./ChannelReport";
import KeywordCompetition from "./KeywordCompetition";
import KeywordInsights from "./KeywordInsights";
import TitlePatternAnalysis from "./TitlePatternAnalysis";
import FilterTab from "./FilterTab";
import ViewStatsInline from "./ViewStatsInline";
import TodaySearchCount from "./TodaySearchCount";
import ShareButton from "./ShareButton";
import ResultFootCards from "./ResultFootCards";
import { ActionToast, BTN_SECONDARY, SelectionBar, selectionActionClass, type ToastData } from "./SelectionBar";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { cx } from "@/components/ui/button";
import { SEGMENT } from "@/components/ui/chip";
import { TABLE, TH, TH_SORT, TH_SORT_ACTIVE } from "@/components/ui/table";
import { ChevronDownIcon } from "@/components/ui/icons";
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
  /** 길이 필터 링크의 공통 쿼리(search/page.tsx 의 filterBase: 차감 없이 이동 + 현재 버전 유지) */
  filterBase?: string;
  /** 유료 플랜: 결과 머리 캡션에 '조회수 합계'를 보인다(지금 노출 조건 그대로) */
  isPaid?: boolean;
  /** 영상 정보 불러오기(로컬 고정 화면이 YouTube 를 부르지 않게 바꿔 넣는다). 기본은 서버 액션 */
  loadVideoInfo?: VideoInfoLoader;
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
  filterBase, isPaid = false, loadVideoInfo,
}: Props) {
  const [videos, setVideos] = useState<Video[]>(() => dedup(initialData || []));
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showChannelReport, setShowChannelReport] = useState(false);

  // ─── 알고리즘 확률 (사용자 옵트인) ───
  // 기본: 비활성. 표 머리 버튼 클릭 → 확인창(useConfirm) → 확인 시에만 활성화
  // ToS III.E.4h 회피: 우리가 자동으로 표시하지 않음. 사용자 명시 동의 후만 사용자 본인 브라우저에서 계산.
  const [probEnabled, setProbEnabled] = useState(false);

  // 더보기 상태
  const [pageToken, setPageToken] = useState<string | undefined>(initPageToken);
  const [pageTokenLong, setPageTokenLong] = useState<string | undefined>(initPageTokenLong);
  const [pageTokenShorts, setPageTokenShorts] = useState<string | undefined>(initPageTokenShorts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  // 토큰 소진 시 다른 정렬로 폴백: relevance → date → viewCount
  const LOAD_ORDERS = ["relevance", "date", "viewCount"] as const;
  const [orderIdx, setOrderIdx] = useState(0);

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

  // 더보기 — relevance 우선, 소진 시 date → viewCount 폴백
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || exhausted) return;
    if (videos.length >= resultLimit) return;
    setIsLoadingMore(true);
    try {
      const currentOrder = LOAD_ORDERS[orderIdx];

      if (filter === "all") {
        const hasTokens = pageTokenLong || pageTokenShorts;

        if (!hasTokens) {
          // 현재 order 소진 → 다음 order로 전환
          const nextIdx = orderIdx + 1;
          if (nextIdx >= LOAD_ORDERS.length) { setExhausted(true); return; }
          setOrderIdx(nextIdx);
          const nextOrder = LOAD_ORDERS[nextIdx];
          const [longRes, shortsRes] = await Promise.all([
            getMoreVideos(query, "long", undefined, nextOrder, region),
            getMoreVideos(query, "shorts", undefined, nextOrder, region),
          ]);
          const newItems = [...(longRes.items || []), ...(shortsRes.items || [])];
          setVideos((prev) => {
            const updated = dedup([...prev, ...newItems]);
            if (updated.length === prev.length && !longRes.nextPageToken && !shortsRes.nextPageToken) setExhausted(true);
            return updated;
          });
          setPageTokenLong(longRes.nextPageToken);
          setPageTokenShorts(shortsRes.nextPageToken);
        } else {
          const [longRes, shortsRes] = await Promise.all([
            pageTokenLong
              ? getMoreVideos(query, "long", pageTokenLong, currentOrder, region)
              : Promise.resolve({ items: [], nextPageToken: undefined, error: null }),
            pageTokenShorts
              ? getMoreVideos(query, "shorts", pageTokenShorts, currentOrder, region)
              : Promise.resolve({ items: [], nextPageToken: undefined, error: null }),
          ]);
          const newItems = [...(longRes.items || []), ...(shortsRes.items || [])];
          setVideos((prev) => {
            const updated = dedup([...prev, ...newItems]);
            if (updated.length === prev.length && !longRes.nextPageToken && !shortsRes.nextPageToken) setExhausted(true);
            return updated;
          });
          setPageTokenLong(longRes.nextPageToken);
          setPageTokenShorts(shortsRes.nextPageToken);
        }
      } else {
        if (!pageToken) {
          // 현재 order 소진 → 다음 order로 전환
          const nextIdx = orderIdx + 1;
          if (nextIdx >= LOAD_ORDERS.length) { setExhausted(true); return; }
          setOrderIdx(nextIdx);
          const nextOrder = LOAD_ORDERS[nextIdx];
          const result = await getMoreVideos(query, filter, undefined, nextOrder, region);
          setVideos((prev) => {
            const updated = dedup([...prev, ...(result.items || [])]);
            if (updated.length === prev.length && !result.nextPageToken) setExhausted(true);
            return updated;
          });
          setPageToken(result.nextPageToken);
        } else {
          const result = await getMoreVideos(query, filter, pageToken, currentOrder, region);
          setVideos((prev) => {
            const updated = dedup([...prev, ...(result.items || [])]);
            if (updated.length === prev.length && !result.nextPageToken) setExhausted(true);
            return updated;
          });
          setPageToken(result.nextPageToken);
        }
      }
    } catch {
      // 로드 실패 시 조용히 무시
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, isLoadingMore, exhausted, orderIdx, pageToken, pageTokenLong, pageTokenShorts, query, resultLimit, videos.length, region]);

  // 더보기 가능 여부: resultLimit 미만이고 소진되지 않았으면 항상 표시
  const hasMore = canLoadMore && videos.length < resultLimit && !exhausted;

  // ─── 화면 상태(보호 구간 밖) ───
  const askConfirm = useConfirm();
  const router = useRouter();
  const titleId = useId();
  /** 분석 도구 줄에서 펼친 도구 하나. 누른 도구만 줄 아래에 펼친다 */
  const [tool, setTool] = useState<"patterns" | "related" | "competition" | "title" | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastSeq = useRef(0);
  const showToast = useCallback((t: Omit<ToastData, "id">) => {
    toastSeq.current += 1;
    setToast({ ...t, id: toastSeq.current });
  }, []);

  // 수집 요청: 응답 상태와 본문(saved·failed)을 확인한 뒤에만 결과를 알린다. 실패하면 negative 토스트 + 다시 시도
  const collect = useCallback(async (targets: Video[]) => {
    setCollecting(true);
    let saved = 0;
    let failed = targets.length;
    try {
      const res = await fetch("/api/saved-videos", {
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
      const data: { saved?: unknown; failed?: unknown } | null = await res.json().catch(() => null);
      if (res.ok && data && typeof data.saved === "number") {
        saved = data.saved;
        failed = typeof data.failed === "number" ? data.failed : Math.max(0, targets.length - data.saved);
      }
    } catch {
      // 네트워크 오류: 전부 실패로 알린다
    } finally {
      setCollecting(false);
    }

    if (failed === 0) {
      showToast({ message: `${saved}개 수집 완료`, action: { label: "수집한 영상 보기", href: "/saved" } });
    } else {
      showToast({
        tone: "error",
        message: `${saved}개 수집, ${failed}개 실패`,
        action: { label: "다시 시도", onClick: () => void collect(targets) },
      });
    }
  }, [query, showToast]);

  // 영상 수집: Pro/Business 전용 — 수집한 영상 탭에 저장 (CSV는 수집한 영상 탭에서 내보내기)
  const handleCollect = useCallback(async () => {
    if (!canCollect) {
      const go = await askConfirm({
        message: "영상 수집은 Pro 플랜부터 사용 가능합니다.",
        subMessage: "요금제 화면에서 업그레이드할 수 있습니다.",
        confirmText: "요금제 보기",
        cancelText: "닫기",
      });
      if (go) router.push("/pricing");
      return;
    }
    const targets = checkedIds.size > 0
      ? sortedVideos.filter((v) => checkedIds.has(v.videoId))
      : sortedVideos;
    await collect(targets);
  }, [sortedVideos, checkedIds, canCollect, collect, askConfirm, router]);

  // 채널 제거: 체크된 영상들의 채널ID를 블랙리스트로 추가해서 필터링. 목록 상태만 바뀌고 되돌릴 수 있다
  const handleRemoveChannels = useCallback(() => {
    if (checkedIds.size === 0) {
      showToast({ message: "제거할 채널의 영상을 먼저 선택해주세요." });
      return;
    }
    const channelIdsToRemove = new Set(
      sortedVideos.filter((v) => checkedIds.has(v.videoId)).map((v) => v.channelId)
    );
    const before = videos;
    setVideos((prev) => prev.filter((v) => !channelIdsToRemove.has(v.channelId)));
    setCheckedIds(new Set());
    showToast({
      message: `${channelIdsToRemove.size}개 채널을 숨겼습니다`,
      action: {
        label: "되돌리기",
        onClick: () => {
          setVideos((prev) => dedup([...before, ...prev]));
          setToast(null);
        },
      },
    });
  }, [sortedVideos, checkedIds, videos, showToast]);

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

  // 조회수 통계 — 결과 머리 캡션의 ViewStatsInline 에 이벤트로 전달
  useEffect(() => {
    const views = videos.map((v) => v.viewCount ?? 0).filter((v) => v > 0);
    const total = views.reduce((sum, v) => sum + v, 0);
    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("UPDATE_VIEW_STATS", { detail: { total, count: videos.length } }));
    }, 0);
    return () => clearTimeout(t);
  }, [videos]);

  // ─── 알고리즘 확률 옵트인: 공용 확인창(문구 그대로) ───
  const requestProb = async () => {
    const ok = await askConfirm({
      message: "알고리즘 확률 분석을 진행하시겠습니까?",
      subMessage:
        "※ 이 도구는 사용자가 직접 활성화하는 자가 계산 도구입니다. YouTube의 공식 메트릭이 아니며, bibl lab이 제공하는 평가 지표가 아닙니다. 공개된 메타데이터를 사용자 브라우저에서 단순 산술로 처리한 참고 값입니다.",
    });
    if (ok) setProbEnabled(true);
  };

  const toggleTool = (t: NonNullable<typeof tool>) => setTool((cur) => (cur === t ? null : t));
  const closeTool = () => setTool(null);

  const hasResults = sortedVideos.length > 0;
  const allChecked = checkedIds.size === sortedVideos.length && sortedVideos.length > 0;
  const someChecked = checkedIds.size > 0 && !allChecked;
  const sortLabel: Record<NonNullable<SortKey>, string> = {
    viewCount: "조회수",
    subscriberCountRaw: "구독자",
    publishedAtRaw: "게시일",
    performanceRatioRaw: "알고리즘 확률",
    scoreValue: "점수",
    algorithmScore: "알고리즘 점수",
  };
  const sortCaption = sortKey ? `${sortLabel[sortKey]} ${sortOrder === "asc" ? "낮은" : "높은"} 순으로 정렬` : "관련도순";

  // ─── 모양 상수 ───
  /** 분석 도구 줄·결과 머리의 보조 버튼(36px · 터치 기기 44px) */
  const TOOL_BUTTON = cx(BTN_SECONDARY, "h-9 shrink-0 px-3 text-body-sm pointer-coarse:h-11 aria-expanded:border-line-hover aria-expanded:bg-surface-3");
  /** 잠긴 동작: 보조 + 라벨 fg-3 + 요금제 태그(DESIGN 6.29, 자물쇠 아이콘 없음). 누르면 요금제 안내(지금 동작 그대로) */
  const LOCKED_BUTTON = cx(BTN_SECONDARY, "h-9 shrink-0 px-3 text-body-sm text-fg-3 hover:text-fg-3 pointer-coarse:h-11");
  const PLAN_TAG = "inline-flex items-center rounded border border-line-strong px-1 text-micro font-medium leading-[18px] text-fg-3";
  const SEP = <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-line" />;

  const renderReportButton = () =>
    canChannelReport ? (
      <button type="button" aria-haspopup="dialog" onClick={() => setShowChannelReport(true)} className={TOOL_BUTTON}>
        채널 리포트
      </button>
    ) : (
      <Link href="/pricing" title="Pro 플랜부터 사용 가능" className={LOCKED_BUTTON}>
        채널 리포트<span className={PLAN_TAG}>Pro</span>
      </Link>
    );

  const renderCollectButton = () =>
    canCollect ? (
      <button type="button" onClick={() => void handleCollect()} disabled={collecting} aria-busy={collecting} className={TOOL_BUTTON}>
        {checkedIds.size > 0 ? `영상 수집 (${checkedIds.size})` : "영상 수집"}
      </button>
    ) : (
      <Link href="/pricing" title="Pro 플랜부터 사용 가능" className={LOCKED_BUTTON}>
        영상 수집<span className={PLAN_TAG}>Pro</span>
      </Link>
    );

  /** 정렬 머리 칸: 버튼 + aria-sort + 화살표(정렬 중 ↓·↑ 흰색, 아니면 ⇅ fg-4) */
  const renderSortHead = (key: NonNullable<SortKey>, label: string, className: string) => {
    const active = sortKey === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
        className={cx(TH, className)}
      >
        <button type="button" onClick={() => handleSort(key)} className={cx(TH_SORT, active && TH_SORT_ACTIVE)}>
          {label}
          <svg
            className={cx("size-3.5", !active && "text-fg-4")}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? 2.2 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={!active ? "m8 9 4-4 4 4M16 15l-4 4-4-4" : sortOrder === "asc" ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
          </svg>
        </button>
      </th>
    );
  };

  /** 1024 미만 정렬 선택 상자: 같은 handleSort 를 부른다(관련도순은 정렬을 끈다) */
  const onSelectSort = (value: string) => {
    if (!value) {
      setSortKey(null);
      setSortOrder("desc");
      return;
    }
    const key = value as NonNullable<SortKey>;
    if (sortKey !== key || sortOrder === "asc") handleSort(key);
  };

  const filterHref = (f: "all" | "long" | "shorts") => {
    const base = `/search?${filterBase ?? `q=${encodeURIComponent(query)}&fromHistory=1&region=${region}`}`;
    return f === "all" ? base : `${base}&filter=${f}`;
  };

  return (
    <div className="w-full pb-12">
      <section aria-labelledby={titleId} className="pt-2 lg:pt-4">
        {/* ─── 결과 머리 한 줄 ─── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <h1 id={titleId} className="order-1 min-w-0 text-h4 font-extrabold text-fg">
            ‘{query}’ 결과 <span className="tnum">{videos.length}</span>개
          </h1>
          <div className="order-2 ml-auto flex items-center gap-1.5 md:order-5 lg:order-4">
            {hasResults && (
              <span className="hidden items-center gap-1.5 lg:flex">
                {renderReportButton()}
                {renderCollectButton()}
              </span>
            )}
            <ShareButton query={query} />
          </div>
          <nav aria-label="영상 길이" className={cx(SEGMENT, "order-3 w-full bg-surface md:w-auto lg:order-2")}>
            <FilterTab href={filterHref("all")} active={filter === "all"} label="전체" />
            <FilterTab href={filterHref("long")} active={filter === "long"} label="쇼츠 제외" />
            <FilterTab href={filterHref("shorts")} active={filter === "shorts"} label="쇼츠만" />
          </nav>
          {/* 조회수 합계(유료) · 오늘 검색 수(5건 이상): 위치·조건·문구 그대로, 한 줄 캡션으로 */}
          <p className="order-4 w-full text-caption text-fg-3 empty:hidden md:w-auto lg:order-3 [&>*+*]:before:mx-1 [&>*+*]:before:content-['·']">
            {isPaid && <ViewStatsInline />}
            <TodaySearchCount />
          </p>
        </div>

        {hasResults && (
          <>
            {/* ─── 분석 도구 줄 ─── */}
            <div className="mt-4 border-y border-line" data-tool-row>
              <div className="scrollbar-hide -mx-6 flex items-center gap-2 overflow-x-auto px-6 py-2 lg:mx-0 lg:px-0 lg:py-2.5">
                <p className="mr-2 hidden shrink-0 text-caption text-fg-3 xl:block">‘{query}’ 키워드 인사이트</p>
                <button type="button" aria-expanded={tool === "patterns"} onClick={() => toggleTool("patterns")} className={TOOL_BUTTON}>
                  상위 영상 패턴 보기
                </button>
                <button type="button" aria-expanded={tool === "related"} onClick={() => toggleTool("related")} className={TOOL_BUTTON}>
                  연관 키워드 추천
                </button>
                {SEP}
                {canAlgorithm ? (
                  <>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded={tool === "competition"}
                      onClick={() => toggleTool("competition")}
                      className={TOOL_BUTTON}
                    >
                      경쟁도 분석 시작
                    </button>
                    <button type="button" aria-expanded={tool === "title"} onClick={() => toggleTool("title")} className={cx(TOOL_BUTTON, "gap-1")}>
                      제목 패턴 분석
                      <ChevronDownIcon size={16} className={cx("text-fg-3 transition-transform", tool === "title" && "rotate-180")} />
                    </button>
                  </>
                ) : (
                  // Free 계정: 경쟁도·제목 패턴 자리에 잠금 버튼 하나(흐린 미리보기·블러·가짜 점수 없음)
                  <Link href="/pricing" title="Starter 플랜 이상에서 이용할 수 있습니다" className={LOCKED_BUTTON}>
                    키워드 경쟁도 · 제목 패턴 분석<span className={PLAN_TAG}>Starter</span>
                  </Link>
                )}
                <span className="contents lg:hidden">
                  {SEP}
                  {renderReportButton()}
                  {renderCollectButton()}
                </span>
                <Link
                  href={`/studio/consulting?source=keyword&query=${encodeURIComponent(query)}`}
                  title="이 키워드로 유튜브 채널 대행 문의하기"
                  className="ml-auto inline-flex h-11 shrink-0 items-center gap-1 pl-3 text-body-sm font-semibold text-accent transition-colors hover:text-accent-hover lg:h-9 pointer-coarse:h-11"
                >
                  유튜브 채널 대행 문의 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            {canAlgorithm && (
              <p className="mt-1.5 text-micro text-fg-3">경쟁도 분석 · 사용자 자가 계산 도구 (YouTube 공식 메트릭 아님)</p>
            )}

            {/* 누른 도구의 패널만 줄 아래에 펼친다(옵트인 확인창 순서 그대로) */}
            {/* 닫혀 있어도 패널은 그려 둔다(경쟁도 옵트인 상태 유지). 빈 칸은 숨겨 간격이 생기지 않게 한다 */}
            <div className={tool ? "mt-4 flex flex-col gap-4 [&>*:empty]:hidden" : "hidden"}>
              <KeywordInsights
                videos={videos}
                query={query}
                open={tool === "patterns" || tool === "related" ? tool : null}
                onClose={closeTool}
              />
              {canAlgorithm && (
                <>
                  <KeywordCompetition videos={videos} query={query} open={tool === "competition"} onClose={closeTool} />
                  <TitlePatternAnalysis videos={videos} open={tool === "title"} onClose={closeTool} />
                </>
              )}
            </div>

            {/* ─── 1024 미만: 전체 선택 + 정렬 선택 상자 ─── */}
            <div className="-mx-6 mt-2 flex items-center justify-between gap-3 border-b border-line pl-[11px] pr-6 lg:hidden">
              <label className="flex h-11 cursor-pointer items-center text-body-sm text-fg-2">
                <span className="flex w-11 justify-center">
                  <input
                    type="checkbox"
                    className="chk"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked;
                    }}
                    onChange={toggleAll}
                  />
                </span>
                전체 선택
              </label>
              <label className="relative flex items-center">
                <span className="sr-only">정렬</span>
                <select
                  value={sortKey ?? ""}
                  onChange={(e) => onSelectSort(e.target.value)}
                  className="h-11 appearance-none rounded-control border border-line bg-surface pl-3 pr-9 text-body-sm text-fg max-md:text-base"
                >
                  <option value="">관련도순(기본)</option>
                  <option value="viewCount">조회수 높은 순</option>
                  <option value="subscriberCountRaw">구독자 많은 순</option>
                  <option value="publishedAtRaw">최근 게시 순</option>
                </select>
                <ChevronDownIcon size={16} className="pointer-events-none absolute right-2.5 text-fg-3" />
              </label>
            </div>
          </>
        )}
      </section>

      {!hasResults && (
        <div className="mt-6 flex flex-col items-start gap-2 rounded-card border border-line bg-surface p-6 md:p-8">
          <p className="text-ui font-semibold text-fg">검색 결과가 없어요</p>
          <p className="text-body-sm text-fg-3">다른 키워드로 검색해보세요</p>
        </div>
      )}

      {hasResults && (
        <>
          {/* ─── 결과 표 (1024 이상) ─── */}
          <div className="mt-2 hidden lg:block">
            <table className={TABLE}>
              <caption className="sr-only">‘{query}’ 검색 결과, {sortCaption}</caption>
              <thead>
                <tr>
                  <th scope="col" className={cx(TH, "w-11")}>
                    <label className="flex size-11 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        className="chk"
                        aria-label="전체 선택"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked;
                        }}
                        onChange={toggleAll}
                      />
                    </label>
                  </th>
                  <th scope="col" className={TH}>
                    영상 <span className="tnum">{sortedVideos.length}</span>
                  </th>
                  <th scope="col" className={cx(TH, "hidden w-[200px] xl:table-cell")}>채널</th>
                  {renderSortHead("viewCount", "조회수", "w-24 pr-4 text-right")}
                  {renderSortHead("subscriberCountRaw", "구독자", "w-[92px] pr-4 text-right")}
                  {renderSortHead("publishedAtRaw", "게시일", "w-[104px] pr-4 text-right")}
                  {/* 알고리즘 확률 — 옵트인 컬럼 (사용자가 명시 동의해야만 활성) */}
                  {probEnabled ? (
                    renderSortHead("performanceRatioRaw", "알고리즘 확률", "w-28 pl-2")
                  ) : (
                    <th scope="col" className={cx(TH, "w-28 pl-2")}>
                      <button
                        type="button"
                        onClick={() => void requestProb()}
                        aria-haspopup="dialog"
                        className="inline-flex h-7 items-center rounded-md border border-line-strong px-2 text-micro font-semibold text-fg-2 transition-colors duration-150 hover:border-line-hover hover:text-fg pointer-coarse:h-11"
                      >
                        알고리즘 확률
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedVideos.map((video) => (
                  <VideoTableRow
            key={video.videoId}
                    video={video}
                    checked={checkedIds.has(video.videoId)}
                    onCheck={() => toggleCheck(video.videoId)}
                    onClick={() => setSelectedVideo(video)}
                    probEnabled={probEnabled}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── 결과 목록 (1024 미만): 왼쪽 44px 띠 = 선택, 나머지 = 영상 정보 열기 ─── */}
          <ul className="divide-y divide-line-soft border-b border-line-soft lg:hidden" aria-label={`‘${query}’ 검색 결과, ${sortCaption}`}>
            {sortedVideos.map((item) => (
              <VideoListItem
                key={item.videoId}
                video={item}
                checked={checkedIds.has(item.videoId)}
                onCheck={() => toggleCheck(item.videoId)}
                onClick={() => setSelectedVideo(item)}
              />
            ))}
          </ul>

          {/* 알고리즘 확률 활성 시 디스클레이머 (표에서만 보인다) */}
          {probEnabled && (
            <p className="mt-3 hidden rounded-card border border-line bg-surface p-3 text-micro text-fg-3 lg:block">
              ※ <strong className="font-semibold text-fg-2">알고리즘 확률은 사용자가 직접 활성화한 자가 계산 도구</strong>입니다.
              표시되는 등급은 YouTube가 제공하는 공식 메트릭이 아니며, bibl lab의 평가/예측이 아닙니다.
              공개된 메타데이터(조회수, 채널 평균 조회수, 게시일)를 사용자의 브라우저에서 단순 산술로 처리한 참고 값입니다.
            </p>
          )}

          {/* ─── 더보기 + 캡션 (숫자는 지금 결과 수와 플랜 결과 한도) ─── */}
          {hasMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                aria-busy={isLoadingMore}
                className={cx(BTN_SECONDARY, "h-12 px-8 text-ui")}
              >
                {isLoadingMore ? (
                  <>
                    <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-fg-2" />
                    불러오는 중...
                  </>
                ) : (
                  "더보기"
                )}
              </button>
              <p className="tnum text-caption text-fg-3">
                {videos.length.toLocaleString()}개 표시 · 더보기로 최대 {resultLimit.toLocaleString()}개
              </p>
            </div>
          )}

          {/* YouTube 결과 소진 — 더 이상 가져올 데이터 없음 (limit 미만) */}
          {canLoadMore && !hasMore && videos.length < resultLimit && videos.length > 0 && (
            <p className="tnum mt-8 text-center text-caption text-fg-3">
              이 키워드의 검색 결과를 모두 불러왔습니다 ({videos.length}건)
            </p>
          )}

          {/* 결과 한도 도달 — 플랜 업그레이드 유도 */}
          {canLoadMore && !hasMore && videos.length >= resultLimit && resultLimit < 1000 && (
            <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-ui font-semibold text-fg">더 많은 결과가 필요하신가요?</p>
                <p className="mt-1 text-body-sm text-fg-3">
                  상위 플랜으로 업그레이드하면 더 많은 결과를 볼 수 있습니다.
                </p>
              </div>
              <Link href="/pricing" className={cx(BTN_SECONDARY, "h-11 shrink-0 px-5 text-body-sm")}>
                업그레이드 <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}

          {/* ─── 결과 아래 안내 카드 2장 ─── */}
          <ResultFootCards showPlanCard={!(canCollect && canChannelReport)} />
        </>
      )}

      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} load={loadVideoInfo} />
      )}
      {showChannelReport && <ChannelReport videos={videos} onClose={() => setShowChannelReport(false)} />}

      {/* ─── 선택 바(채널 제거) · 결과 토스트 ─── */}
      <SelectionBar count={checkedIds.size} onClear={() => setCheckedIds(new Set())}>
        {(size) => (
          <button type="button" onClick={handleRemoveChannels} className={selectionActionClass(size)}>
            채널 제거
          </button>
        )}
      </SelectionBar>
      <ActionToast toast={toast} onDismiss={() => setToast(null)} raised={checkedIds.size > 0} />
    </div>
  );
}
