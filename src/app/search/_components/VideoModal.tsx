"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 썸네일·채널 아이콘 원본 URL */
/**
 * 영상 정보 대화상자 (DESIGN 6.11·6.15, 시안 design-final/silver/app.html 748~768행)
 *
 * - 셸은 components/ui/dialog.tsx(최상위 층, 포커스 가둠·복귀, Esc·바깥 누르기 닫기, 스크롤 잠금).
 *   모바일은 전체 화면 시트(h-dvh), 768 이상은 가운데 상자(max-h calc(100dvh-2rem)).
 * - 'YouTube에서 보기'는 대화상자 안 흰 면 하나(빨간 표시 없음, 새 창은 sr-only 로 알린다). 나머지는 보조 버튼.
 * - 불러오기가 끝났는데 영상·채널 정보가 없으면 '불러오지 못했습니다 · 다시 시도'(같은 fetchData 를 다시 부른다).
 * - 사용자 도구(자가 계산·AI 분석)는 사용자가 누를 때만 동작한다(YouTube ToS III.E.4h). 문구·조건 그대로, 모양만.
 */
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Video } from "@/types";
import { fetchVideoDetail, fetchVideoComments, fetchChannelDetail } from "../actions";
import { Dialog } from "@/components/ui/dialog";
import { cx } from "@/components/ui/button";
import { ChevronDownIcon, CloseIcon, WarningIcon } from "@/components/ui/icons";
import { formatCompactKo } from "@/lib/format";
import { BTN_BASE, BTN_GHOST, BTN_SECONDARY } from "./SelectionBar";

type VideoDetail = Awaited<ReturnType<typeof fetchVideoDetail>>;
type ChannelDetail = Awaited<ReturnType<typeof fetchChannelDetail>>;
type Comment = {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  replyCount?: number;
  replies?: { id: string; author: string; text: string; likeCount: number; publishedAt: string }[];
};

/**
 * 영상 정보 불러오기. 기본은 서버 액션 3개(영상·댓글 → 채널). 로컬 고정 화면(ux-preview)은 YouTube 를 부르지 않게 바꿔 넣는다.
 */
export type VideoInfoLoader = (video: Video) => Promise<{
  detail: VideoDetail;
  comments: Comment[];
  channel: ChannelDetail;
}>;

const defaultLoader: VideoInfoLoader = async (video) => {
  const [detail, comments] = await Promise.all([
    fetchVideoDetail(video.videoId),
    fetchVideoComments(video.videoId),
  ]);
  const channel = detail && detail.channelId ? await fetchChannelDetail(detail.channelId) : null;
  return { detail, comments, channel };
};

interface Props {
  video: Video;
  onClose: () => void;
  load?: VideoInfoLoader;
}

// XSS 방지: HTML 태그 제거 후 텍스트만 반환 (줄바꿈 보존)
function sanitizeComment(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** 구역 제목 */
const SECTION_TITLE = "mb-3 text-body-sm font-semibold text-fg-2";
/** 대화상자(surface-2) 안 상자: 한 단 낮은 surface + 1px 선 */
const INNER_BOX = "rounded-control border border-line bg-surface";

// [작은 통계 칸]
function StatBox({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className={cx(INNER_BOX, "flex flex-col-reverse gap-1 p-3")}>
      <dt className="text-micro text-fg-3">
        {label}
        {subValue && <span className="tnum block">{subValue}</span>}
      </dt>
      <dd className="tnum whitespace-nowrap text-body font-bold text-fg">{value}</dd>
    </div>
  );
}

// [댓글]
function CommentItem({ comment }: { comment: Comment }) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = !!comment.replies && comment.replies.length > 0;

  return (
    <li className={cx(INNER_BOX, "p-4")}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <span className="text-body-sm font-semibold text-fg-1">{comment.author}</span>
        <span className="tnum shrink-0 text-micro text-fg-3">{comment.publishedAt}</span>
      </div>
      <p className="mb-2 whitespace-pre-wrap break-words text-body-sm text-fg-2">{sanitizeComment(comment.text)}</p>
      <div className="flex items-center gap-4">
        <span className="tnum text-micro text-fg-3">좋아요 {comment.likeCount}</span>
        {hasReplies && (
          <button
            type="button"
            onClick={() => setShowReplies(!showReplies)}
            aria-expanded={showReplies}
            className="-my-2 inline-flex h-11 items-center gap-1 text-micro font-semibold text-fg-2 transition-colors hover:text-fg"
          >
            {showReplies ? "답글 접기" : `답글 ${comment.replyCount}개 보기`}
            <ChevronDownIcon size={16} className={cx("text-fg-3 transition-transform", showReplies && "rotate-180")} />
          </button>
        )}
      </div>
      {showReplies && hasReplies && (
        <ul className="mt-3 space-y-3 border-l-2 border-line pl-4">
          {comment.replies!.map((reply) => (
            <li key={reply.id}>
              <div className="mb-1 flex items-start justify-between gap-3">
                <span className="text-micro font-semibold text-fg-2">{reply.author}</span>
                <span className="tnum shrink-0 text-micro text-fg-3">{reply.publishedAt}</span>
              </div>
              <p className="mb-1 whitespace-pre-wrap break-words text-body-sm text-fg-2">{sanitizeComment(reply.text)}</p>
              <span className="tnum text-micro text-fg-3">좋아요 {reply.likeCount}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function VideoModal({ video, onClose, load = defaultLoader }: Props) {
  const titleId = useId();
  const [detail, setDetail] = useState<VideoDetail>(null);
  const [channelInfo, setChannelInfo] = useState<ChannelDetail>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ─── 사용자 자가 계산기 (클라이언트 측만, 사용자 명시 클릭 시에만 실행) ───
  const [calcResult, setCalcResult] = useState<null | { ratio: number; videoViews: number; avgViews: number; pct: number }>(null);

  // ─── AI 분석 (사용자 명시 클릭 시 외부 LLM API 호출 또는 ChatGPT 새 탭) ───
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNeedsPlan, setAiNeedsPlan] = useState(false); // 429 한도 0(Free): 오류 칸에 '요금제 보기 →'

  async function fetchData() {
    setLoading(true);
    setFetchError(false);
    try {
      const { detail: d, comments: c, channel } = await load(video);
      setDetail(d);
      setComments(c ?? []);
      setChannelInfo(channel);
    } catch (e) {
      console.error(e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

  // 불러오기가 끝났는데 영상·채널 정보가 없으면 실패로 본다(서버 액션은 실패해도 null 을 돌려준다)
  const failed = !loading && (fetchError || !detail || !channelInfo);

  const visibleComments = isExpanded ? comments : comments.slice(0, 1);

  // --- YouTube가 직접 제공하는 데이터(평균 조회수는 채널 총 조회수 ÷ 영상 수, 단순 산술) ---
  // 평균 조회수는 채널 통계로 표시만 하고, 영상 단일 비교는 사용자가 버튼 눌러야만 계산
  const avgViews = channelInfo && channelInfo.videoCount > 0
    ? Math.round(channelInfo.viewCount / channelInfo.videoCount)
    : 0;
  const daysSinceJoin = channelInfo ? Math.floor((new Date().getTime() - new Date(channelInfo.publishedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // ─── 사용자 자가 계산 핸들러 (클릭 시에만 실행) ───
  // YouTube ToS III.E.4h: 우리가 "제공(offer)"하는 게 아니라 사용자가 직접 계산 도구를 사용
  function handleSelfCalculate() {
    if (!detail || !detail.rawViewCount || !avgViews) return;
    const videoViews = detail.rawViewCount;
    const ratio = videoViews / avgViews;
    const pct = ((videoViews - avgViews) / avgViews) * 100;
    setCalcResult({ ratio, videoViews, avgViews, pct });
  }

  // ─── AI 분석 핸들러 (사용자 클릭 시 외부 LLM 호출) ───
  async function handleAiAnalyze() {
    if (!detail || !channelInfo) return;
    setAiLoading(true);
    setAiError(null);
    setAiNeedsPlan(false);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: video.title,
          videoViews: detail.rawViewCount ?? 0,
          videoDescription: (detail.description || "").slice(0, 1000),
          channelTitle: video.channelTitle,
          channelSubscribers: channelInfo.subscriberCount,
          channelAvgViews: avgViews,
          channelTotalVideos: channelInfo.videoCount,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        // 하루 횟수 초과(T0b). 문구는 서버 message(LEGACY_MESSAGES) 하나를 쓰고, 없을 때만 같은 문구로 대신한다
        const needsPlan = data.limit === 0;
        setAiNeedsPlan(needsPlan);
        setAiError(data.message || (needsPlan ? "AI 분석은 유료 요금제에서 쓸 수 있어요." : "오늘 AI 분석 횟수를 다 썼어요."));
        return;
      }
      if (!res.ok) {
        setAiError(data.message || "AI 분석에 실패했습니다.");
        return;
      }
      setAiResult(data.text);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI 분석 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  // ─── ChatGPT/Claude 새 탭으로 열기 (AI API 키 없을 때 백업) ───
  function handleOpenChatGPT() {
    if (!detail || !channelInfo) return;
    const prompt = `다음 유튜브 영상이 잘 된 이유를 분석해줘:\n\n` +
      `[영상] ${video.title}\n` +
      `조회수: ${(detail.rawViewCount ?? 0).toLocaleString()}회\n\n` +
      `[채널] ${video.channelTitle}\n` +
      `구독자: ${channelInfo.subscriberCount.toLocaleString()}명\n` +
      `총 영상 수: ${channelInfo.videoCount}개\n` +
      `채널 평균 조회수: ${avgViews.toLocaleString()}회\n\n` +
      `이 영상이 잘 된 이유, 제목/썸네일 패턴, 벤치마킹 포인트를 3~5줄로 알려줘.`;
    const url = `https://chat.openai.com/?prompt=${encodeURIComponent(prompt)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const channelUrl = `https://www.youtube.com/channel/${detail?.channelId || video.channelId}`;
  const TOOL_BUTTON = cx(BTN_SECONDARY, "h-11 px-4 text-body-sm");
  const SMALL_CLOSE = cx(BTN_GHOST, "-my-2 h-11 shrink-0 px-2 text-micro");

  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy={titleId}
      className={cx(
        "overflow-y-auto overscroll-contain",
        // 모바일: 전체 화면 시트
        "max-md:m-0 max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-5 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        // 768 이상: 가운데 상자
        "md:max-h-[calc(100dvh-2rem)] md:max-w-xl",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-fg-3">영상 정보</p>
        <button type="button" onClick={onClose} aria-label="닫기" className={cx(BTN_GHOST, "-mr-2 size-11 shrink-0")}>
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="mt-2 overflow-hidden rounded-control bg-surface">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" width={640} height={360} decoding="async" className="aspect-video w-full object-cover" />
        ) : (
          <span className="block aspect-video w-full" />
        )}
      </div>

      <h2 id={titleId} className="mt-4 text-lead font-bold leading-[1.45] text-fg">{video.title}</h2>

      <div className="mt-3 flex items-center gap-2.5">
        {video.channelThumbnail ? (
          <img src={video.channelThumbnail} alt="" width={32} height={32} decoding="async" className="size-8 shrink-0 rounded-full bg-surface-3 object-cover" />
        ) : (
          <span aria-hidden="true" className="block size-8 shrink-0 rounded-full bg-surface-3" />
        )}
        <p className="min-w-0 text-body-sm">
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-fg transition-colors hover:text-fg-2">
            {video.channelTitle}
            <svg className="ext ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
            <span className="sr-only">(새 창)</span>
          </a>{" "}
          <span className="tnum text-fg-3">구독자 {formatCompactKo(video.subscriberCountRaw ?? 0)}</span>
        </p>
      </div>

      <p className="tnum mt-3 text-body-sm text-fg-2">
        <span className="font-extrabold text-fg">조회수 {formatCompactKo(video.viewCount ?? 0)}회</span>
        {" · "}
        {video.publishedAt.replace(/-/g, ".")}
        {video.duration && <> · {video.duration}</>}
        {detail && (
          <>
            {" · "}좋아요 {detail.likeCount} · 댓글 {detail.commentCount}
          </>
        )}
      </p>

      <div className="mt-6 flex gap-2">
        <a
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(BTN_BASE, "h-11 flex-1 bg-accent px-5 text-ui font-bold text-accent-ink hover:bg-accent-hover active:bg-accent-active")}
        >
          YouTube에서 보기<span className="sr-only">(새 창)</span>
        </a>
        <button type="button" onClick={onClose} className={cx(BTN_SECONDARY, "h-11 px-5 text-ui")}>
          닫기
        </button>
      </div>

      {/* 불러오는 중 · 실패 */}
      {loading && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-3">
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-fg-2" />
          정보를 불러오는 중...
        </p>
      )}
      {failed && (
        <div role="alert" className="mt-6 flex items-center gap-3 rounded-card border border-line bg-surface py-1.5 pl-4 pr-1.5">
          <WarningIcon size={16} className="shrink-0 text-negative" />
          <p className="min-w-0 flex-1 py-2.5 text-body-sm font-semibold text-fg">불러오지 못했습니다</p>
          <button type="button" onClick={fetchData} className={cx(BTN_GHOST, "h-11 shrink-0 px-3 text-body-sm text-fg")}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && detail && (
        <div className="mt-6 space-y-6 border-t border-line pt-6">
          {/* 태그 · 설명 */}
          {detail.tags && detail.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="태그">
              {detail.tags.slice(0, 5).map((tag) => (
                <li key={tag} className="inline-flex items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">#{tag}</li>
              ))}
            </ul>
          )}
          <section aria-label="영상 설명">
            <h3 className={SECTION_TITLE}>설명</h3>
            <p className={cx(INNER_BOX, "whitespace-pre-wrap p-4 text-body-sm text-fg-2 md:max-h-40 md:overflow-y-auto")}>
              {detail.description || "설명이 없습니다."}
            </p>
          </section>

          {/* 베스트 댓글 */}
          <section aria-label="베스트 댓글">
            <h3 className={SECTION_TITLE}>베스트 댓글</h3>
            {comments.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {visibleComments.map((c) => (
                    <CommentItem key={c.id} comment={c} />
                  ))}
                </ul>
                {comments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    className={cx(BTN_GHOST, "mt-2 h-11 w-full text-body-sm")}
                  >
                    {isExpanded ? "접기" : `댓글 ${comments.length - 1}개 더보기`}
                    <ChevronDownIcon size={16} className={cx("text-fg-3 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                )}
              </>
            ) : (
              <p className="text-body-sm text-fg-3">댓글이 없거나 불러올 수 없습니다.</p>
            )}
          </section>
        </div>
      )}

      {/* 채널 상세 정보 */}
      {!loading && channelInfo && (
        <section aria-label="채널 정보" className="mt-6 border-t border-line pt-6">
          <h3 className={SECTION_TITLE}>채널 정보</h3>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatBox label="구독자" value={`${channelInfo.subscriberCount.toLocaleString()}명`} />
            <StatBox label="총 영상 수" value={`${channelInfo.videoCount.toLocaleString()}개`} />
            <StatBox label="채널 개설일" value={channelInfo.publishedAt.replace(/-/g, ".")} subValue={`${daysSinceJoin.toLocaleString()}일 경과`} />
            <StatBox label="누적 조회수" value={formatCompactKo(channelInfo.viewCount)} subValue={channelInfo.viewCount.toLocaleString()} />
            <StatBox label="평균 조회수" value={avgViews.toLocaleString()} />
          </dl>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <h4 className="mb-2 text-micro font-semibold text-fg-3">채널 설명</h4>
              <p className={cx(INNER_BOX, "whitespace-pre-wrap p-4 text-body-sm text-fg-2 md:max-h-40 md:overflow-y-auto")}>
                {channelInfo.description}
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-micro font-semibold text-fg-3">채널 키워드</h4>
              {channelInfo.keywords && channelInfo.keywords.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5 md:max-h-40 md:overflow-y-auto">
                  {channelInfo.keywords.map((k, i) => (
                    <li key={i} className="inline-flex items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">#{k}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-fg-3">설정된 키워드가 없습니다.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 사용자 도구 — 본인이 명시적으로 클릭해야 작동 */}
      {!loading && channelInfo && detail && (
        <section aria-label="사용자 도구" className="mt-6 border-t border-line pt-6">
          <h3 className="mb-1 text-body-sm font-semibold text-fg-2">사용자 도구</h3>
          <p className="mb-4 text-micro text-fg-3">
            아래 도구는 사용자가 직접 실행할 때만 동작합니다. 표시되는 결과는 YouTube 공식 메트릭이 아닌, 사용자가 자가 계산하거나 외부 AI가 생성한 참고용 정보입니다.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={handleSelfCalculate} className={TOOL_BUTTON}>
              채널 평균 대비 비율 계산하기
            </button>
            <button type="button" onClick={handleAiAnalyze} disabled={aiLoading} aria-busy={aiLoading} className={TOOL_BUTTON}>
              {aiLoading ? (
                <>
                  <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-fg-2" />
                  AI가 분석 중...
                </>
              ) : (
                "AI에게 이 영상이 잘 된 이유 묻기"
              )}
            </button>
          </div>

          {/* 자가 계산 결과 표시 (사용자 클릭 후에만 나타남) */}
          {calcResult && (
            <div className={cx(INNER_BOX, "mt-3 p-4")}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <h4 className="text-body-sm font-semibold text-fg">사용자 자가 계산 결과</h4>
                <button type="button" onClick={() => setCalcResult(null)} className={SMALL_CLOSE}>닫기</button>
              </div>
              <p className="mb-3 text-micro text-fg-3">
                ※ 이 수치는 사용자가 직접 도구를 실행하여 클라이언트(브라우저)에서 단순 산술로 계산한 값입니다.
                YouTube의 공식 메트릭이 아니며, bibl lab이 제공하는 평가 지표가 아닙니다.
              </p>
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-micro text-fg-3">이 영상 조회수</dt>
                  <dd className="tnum text-body-sm font-bold text-fg">{calcResult.videoViews.toLocaleString()}</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-micro text-fg-3">채널 평균 조회수</dt>
                  <dd className="tnum text-body-sm font-bold text-fg">{calcResult.avgViews.toLocaleString()}</dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-micro text-fg-3">사용자 계산값</dt>
                  <dd className="tnum text-body-sm font-bold text-fg">
                    {calcResult.ratio.toFixed(2)}x
                    {/* 상승 positive ▲ · 하락 negative ▼ (DESIGN 3.1, 기호와 함께) */}
                    <span className={cx("mt-0.5 block text-micro", calcResult.pct >= 0 ? "text-positive" : "text-negative")}>
                      <span aria-hidden="true">{calcResult.pct >= 0 ? "▲ " : "▼ "}</span>
                      {calcResult.pct >= 0 ? "+" : ""}{calcResult.pct.toFixed(1)}%
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* AI 분석 결과 표시 */}
          {aiResult && (
            <div className={cx(INNER_BOX, "mt-3 p-4")}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <h4 className="text-body-sm font-semibold text-fg">AI 분석 결과</h4>
                <button type="button" onClick={() => setAiResult(null)} className={SMALL_CLOSE}>닫기</button>
              </div>
              <p className="mb-3 text-micro text-fg-3">
                ※ 외부 AI 서비스(OpenAI/Anthropic)가 생성한 텍스트입니다. bibl lab이 제공하는 메트릭이나 평가가 아니며, YouTube의 공식 정보도 아닙니다.
              </p>
              <div className="whitespace-pre-wrap text-body-sm text-fg-2">{aiResult}</div>
            </div>
          )}

          {/* AI 에러 시 ChatGPT 새 탭 백업 */}
          {aiError && (
            <div role="alert" className={cx(INNER_BOX, "mt-3 p-4")}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <h4 className="flex items-center gap-2 text-body-sm font-semibold text-caution">
                  <WarningIcon size={16} />
                  AI 분석을 사용할 수 없습니다
                </h4>
                <button type="button" onClick={() => setAiError(null)} className={SMALL_CLOSE}>닫기</button>
              </div>
              <p className="mb-3 text-body-sm text-fg-3">{aiError}</p>
              {aiNeedsPlan && (
                <div className="-mt-2 mb-2">
                  <Link
                    href="/pricing"
                    className="inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors hover:text-fg-2"
                  >
                    요금제 보기 <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
              <button type="button" onClick={handleOpenChatGPT} className={cx(BTN_SECONDARY, "h-11 px-4 text-body-sm")}>
                ChatGPT에서 분석 요청 (새 탭)
              </button>
            </div>
          )}
        </section>
      )}
    </Dialog>
  );
}
