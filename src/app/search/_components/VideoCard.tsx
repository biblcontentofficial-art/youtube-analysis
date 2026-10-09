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
 * - 알고리즘 확률은 사용자가 옵트인한 뒤 표에서만 등급 배지로 보인다(모바일 목록에는 새로 노출하지 않는다).
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
  probEnabled?: boolean;
}

type Grade = "Great" | "Good" | "Normal" | "Bad" | "Worst";

// ─── 확률 라벨 계산 (사용자 옵트인 후 클라이언트 사이드 단순 산술) ───
// performanceRatioRaw = 영상 조회수 ÷ 채널 평균 조회수
// 임계값은 사용자 가이드라인 (YouTube 공식 메트릭 아님)
function calcProbabilityLabel(ratio: number | undefined): { label: Grade } {
  const r = ratio ?? 0;
  if (r >= 5) return { label: "Great" };
  if (r >= 2) return { label: "Good" };
  if (r >= 0.5) return { label: "Normal" };
  if (r >= 0.1) return { label: "Bad" };
  return { label: "Worst" };
}

/**
 * 등급 배지(DESIGN 6.12). 기능 색은 글자·테두리에만, 면은 Great 작은 배지 하나. 색만으로 말하지 않게 라벨을 늘 쓴다.
 * 흰색은 '좋음'에 쓰지 않는다(선택·현재 위치 뜻).
 */
const GRADE_BASE =
  "inline-flex h-[22px] items-center rounded-[5px] border border-transparent px-[7px] text-micro font-bold leading-none";
const GRADE_TONE: Record<Grade, string> = {
  Great: "bg-positive text-accent-ink",
  Good: "border-positive/55 text-positive",
  Normal: "border-line-strong text-fg-3",
  Bad: "border-caution/55 text-caution",
  Worst: "border-negative/55 text-negative",
};

function GradeBadge({ ratio }: { ratio: number | undefined }) {
  const { label } = calcProbabilityLabel(ratio);
  return (
    <span title="사용자 자가 계산값 (YouTube 공식 메트릭 아님)" className={cx(GRADE_BASE, GRADE_TONE[label])}>
      {label}
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
export function VideoTableRow({ video, checked, onCheck, onClick, probEnabled }: RowProps) {
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
      <td className={cx(TD, "tnum pr-4 text-right text-body-sm text-fg-2")}>
        {formatCompactKo(video.subscriberCountRaw ?? 0)}
      </td>
      <td className={cx(TD, "tnum whitespace-nowrap pr-4 text-right text-body-sm text-fg-3")}>{dateLabel(video.publishedAt)}</td>
      {/* 알고리즘 확률(옵트인): 활성 전에는 비워 둔다. 카카오 버튼(오른쪽 아래)에 가리지 않게 왼쪽 정렬 */}
      <td className={cx(TD, "pl-2")}>{probEnabled && <GradeBadge ratio={video.performanceRatioRaw} />}</td>
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
            <span className="whitespace-nowrap">구독자 {formatCompactKo(video.subscriberCountRaw ?? 0)} ·</span>
            <span className="whitespace-nowrap">{dateLabel(video.publishedAt)}</span>
          </p>
        </div>
      </div>
    </li>
  );
}
