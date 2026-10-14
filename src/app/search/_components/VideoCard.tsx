"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 썸네일·채널 아이콘 원본 URL */
// next/image 대신 <img> 사용 — Vercel Image Optimization 비용 절감
// YouTube 썸네일은 YouTube CDN이 이미 최적화해서 제공하므로 재최적화 불필요
// YouTube ToS III.E.4h 준수: ScoreBadge, AlgorithmBadge, ViewTrendGraph 등 파생 지표 표시 컴포넌트 제거
/**
 * 검색 결과 한 행. 1024 이상 표의 행(VideoTableRow)과 1024 미만 목록의 행(VideoListItem) 두 모양 (DESIGN 6.10, 시안 app.html 413·584행)
 *
 * - 영상 칸은 relative 이고 제목이 <h3><button> 이라, ::after 가 썸네일까지 덮어 어디를 눌러도 영상 정보가 열린다.
 *   썸네일은 마우스 전용(alt="", 키보드는 제목 버튼 하나).
 * - 목록은 왼쪽 44px 띠만 선택(label), 나머지는 영상 정보 열기. 행 전체를 label 로 만들지 않는다.
 * - 조회수 옆에 '채널 평균 조회수의 몇 배'(아웃라이어 배수)를 보여 준다. 2배 이상만 흰 글자로 강조.
 */
import type { Video } from "@/types";
import { cx } from "@/components/ui/button";
import { ROW, ROW_SELECTED, TD } from "@/components/ui/table";
import { formatCompactKo } from "@/lib/format";

interface RowProps {
  video: Video;
  checked: boolean;
  onCheck: () => void;
  onClick: () => void;
}

/**
 * 아웃라이어 배수 = 영상 조회수 ÷ 채널 평균 조회수(채널 누적 조회수 ÷ 영상 수, performanceRatioRaw).
 * 10배 미만은 소수 한 자리, 이상은 정수. 계산할 수 없으면 '-'.
 */
export function outlierLabel(ratio: number | undefined): string {
  const r = ratio ?? 0;
  if (!r || !Number.isFinite(r)) return "-";
  if (r >= 10) return `${Math.round(r).toLocaleString("ko-KR")}배`;
  return `${r.toFixed(1).replace(/\.0$/, "")}배`;
}

function Outlier({ ratio, className }: { ratio: number | undefined; className?: string }) {
  const strong = (ratio ?? 0) >= 2;
  return (
    <span title="채널 평균 조회수 대비" className={cx("tnum", strong ? "font-bold text-fg" : "text-fg-3", className)}>
      {outlierLabel(ratio)}
    </span>
  );
}

/** 쇼츠(3분 이하)·롱폼 무채색 태그 12px (빨강·파랑 금지, DESIGN 6.10·6.12) */
function LengthTag({ video }: { video: Video }) {
  const isShorts = (video.durationSeconds ?? 9999) <= 180;
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-line-strong px-1.5 text-micro leading-[18px] text-fg-2">
      {isShorts ? "쇼츠" : "롱폼"}
    </span>
  );
}

/** 게시일 2026-09-20 → 2026.09.20 */
function dateLabel(publishedAt: string) {
  return publishedAt ? publishedAt.replace(/-/g, ".") : "-";
}

/** 영상 정보 열기 버튼: ::after 가 영상 칸 전체(썸네일 포함)를 덮고, 포커스 링도 그 둘레에 그린다 */
const OPEN_BUTTON =
  "line-clamp-2 cursor-pointer text-left after:absolute after:inset-0 after:rounded-control focus-visible:outline-hidden focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-accent";

function Thumb({ video, className }: { video: Video; className: string }) {
  return (
    <span className={cx("relative block shrink-0 self-start overflow-hidden rounded-control bg-surface-2", className)}>
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          decoding="async"
          className="aspect-video w-full object-cover"
        />
      )}
      {!video.thumbnail && <span className="block aspect-video w-full" />}
      {video.duration && (
        <span className="tnum absolute bottom-1.5 right-1.5 rounded bg-canvas/80 px-1.5 py-0.5 text-micro font-semibold leading-none text-fg">
          {video.duration}
        </span>
      )}
    </span>
  );
}

function Avatar({ src, px, className }: { src?: string; px: number; className: string }) {
  if (!src) return <span aria-hidden="true" className={cx("block shrink-0 rounded-full bg-surface-3", className)} />;
  return (
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={cx("shrink-0 rounded-full bg-surface-2 object-cover", className)}
    />
  );
}

// ─── 1024 이상: 표의 행 ───────────────────────────────────────────────────────
export function VideoTableRow({ video, checked, onCheck, onClick }: RowProps) {
  const views = formatCompactKo(video.viewCount ?? 0);
  return (
    <tr className={cx(checked ? ROW_SELECTED : ROW, "content-auto")}>
      <td className={TD}>
        <label className="flex size-11 cursor-pointer items-center justify-center">
          <input type="checkbox" className="chk" checked={checked} onChange={onCheck} aria-label={`${video.title} 선택`} />
        </label>
      </td>
      <td className={cx(TD, "relative pr-6")}>
        <div className="flex items-center gap-4">
          <Thumb video={video} className="w-32 xl:w-36" />
          <div className="min-w-0 flex-1">
            <h3 className="text-ui font-medium leading-[1.5] text-fg-1">
              <button type="button" aria-haspopup="dialog" onClick={onClick} className={cx(OPEN_BUTTON, "hover:underline hover:underline-offset-4")}>
                {video.title}
              </button>
            </h3>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-caption text-fg-3">
              <LengthTag video={video} />
              <span className="flex min-w-0 items-center gap-2 xl:hidden">
                <Avatar src={video.channelThumbnail} px={20} className="size-5" />
                <span className="truncate">{video.channelTitle}</span>
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className={cx(TD, "hidden pr-4 xl:table-cell")}>
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar src={video.channelThumbnail} px={32} className="size-8" />
          <span className="truncate text-body-sm text-fg-2">{video.channelTitle}</span>
        </span>
      </td>
      <td className={cx(TD, "tnum pr-4 text-right")}>
        <span className="text-[18px] font-extrabold tracking-[-0.02em] text-fg" title={video.viewCountFormatted}>
          {views}
        </span>
      </td>
      <td className={cx(TD, "pr-4 text-right text-body-sm")}>
        <Outlier ratio={video.performanceRatioRaw} />
      </td>
      <td className={cx(TD, "tnum pr-4 text-right text-body-sm text-fg-2")}>
        {formatCompactKo(video.subscriberCountRaw ?? 0)}
      </td>
      <td className={cx(TD, "tnum whitespace-nowrap pr-4 text-right text-body-sm text-fg-3")}>{dateLabel(video.publishedAt)}</td>
    </tr>
  );
}

// ─── 1024 미만: 목록의 행 ─────────────────────────────────────────────────────
export function VideoListItem({ video, checked, onCheck, onClick }: RowProps) {
  return (
    <li
      className={cx(
        "content-auto -mx-6 flex pl-[11px] pr-6 transition-colors duration-150",
        checked ? "bg-surface-2 shadow-[inset_2px_0_0_var(--color-accent)]" : "hover:bg-surface-2/55",
      )}
    >
      <label className="flex w-11 shrink-0 cursor-pointer justify-center pt-[19px]">
        <input type="checkbox" className="chk" checked={checked} onChange={onCheck} aria-label={`${video.title} 선택`} />
      </label>
      <div className="relative flex min-w-0 flex-1 gap-3 py-4">
        <Thumb video={video} className="w-28 md:w-44" />
        <div className="min-w-0 flex-1">
          <h3 className="text-ui font-medium leading-[1.45] text-fg-1 md:text-body">
            <button type="button" aria-haspopup="dialog" onClick={onClick} className={OPEN_BUTTON}>
              {video.title}
            </button>
          </h3>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-micro text-fg-3">
            <LengthTag video={video} />
            <span className="truncate">{video.channelTitle}</span>
          </p>
          <p className="tnum mt-0.5 flex flex-wrap items-baseline gap-x-1 text-micro text-fg-3">
            {/* 구분점은 앞 항목 끝에 붙인다: 줄이 넘어가도 새 줄 첫머리에 '·'가 홀로 남지 않게 */}
            <span className="whitespace-nowrap">
              <span className="text-body-sm font-extrabold leading-[1.4] tracking-[-0.02em] text-fg">
                {formatCompactKo(video.viewCount ?? 0)}회
              </span>{" "}
              ·
            </span>
            <span className="whitespace-nowrap">
              평균의 <Outlier ratio={video.performanceRatioRaw} /> ·
            </span>
            <span className="whitespace-nowrap">구독자 {formatCompactKo(video.subscriberCountRaw ?? 0)} ·</span>
            <span className="whitespace-nowrap">{dateLabel(video.publishedAt)}</span>
          </p>
        </div>
      </div>
    </li>
  );
}
