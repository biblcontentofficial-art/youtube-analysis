"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 채널 아이콘 원본 URL */
/**
 * 채널 분석 리포트 대화상자 (Pro). 셸은 components/ui/dialog.tsx, 영상 정보와 같은 배치:
 * 모바일은 전체 화면 시트(h-dvh), 768 이상은 가운데 상자(max-h calc(100dvh-2rem)). 머리는 고정, 표만 스크롤한다.
 * YouTube ToS III.E.4h 준수: 파생/계산 지표 컬럼(Good 수, 최대 비율)은 넣지 않는다.
 */
import { useId, useMemo } from "react";
import { Video } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { cx } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { formatCompactKo } from "@/lib/format";
import { BTN_GHOST } from "./SelectionBar";

interface ChannelStat {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string;
  subscriberCountRaw: number;
  subscriberCount: string;
  videoCount: number;
  totalViews: number;
  avgViews: number;
  maxRatio: number;
  goodCount: number;
  topVideo: Video;
}

interface Props {
  videos: Video[];
  onClose: () => void;
}

/** 대화상자(surface-2) 안 표 머리: 스크롤 영역 위에 붙는다 */
const RTH = "sticky top-0 z-10 border-b border-line bg-surface-2 px-4 py-2.5 text-micro font-medium text-fg-3";
const RTD = "border-b border-line-soft px-4 py-2.5 align-middle";

export default function ChannelReport({ videos, onClose }: Props) {
  const titleId = useId();
  const channels = useMemo<ChannelStat[]>(() => {
    const map = new Map<string, ChannelStat>();

    for (const v of videos) {
      if (!map.has(v.channelId)) {
        map.set(v.channelId, {
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          channelThumbnail: v.channelThumbnail,
          subscriberCountRaw: v.subscriberCountRaw,
          subscriberCount: v.subscriberCount,
          videoCount: 0,
          totalViews: 0,
          avgViews: 0,
          maxRatio: 0,
          goodCount: 0,
          topVideo: v,
        });
      }
      const ch = map.get(v.channelId)!;
      ch.videoCount++;
      ch.totalViews += v.viewCount ?? 0;
      if ((v.performanceRatioRaw ?? 0) > ch.maxRatio) {
        ch.maxRatio = v.performanceRatioRaw ?? 0;
        ch.topVideo = v;
      }
      if (v.score === "Good") ch.goodCount++;
    }

    const result = Array.from(map.values()).map((ch) => ({
      ...ch,
      avgViews: ch.videoCount > 0 ? Math.round(ch.totalViews / ch.videoCount) : 0,
    }));

    // 영상 수 내림차순 → 평균 조회수 내림차순
    result.sort((a, b) => b.videoCount - a.videoCount || b.avgViews - a.avgViews);
    return result;
  }, [videos]);

  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy={titleId}
      className={cx(
        "flex-col overflow-hidden open:flex max-md:p-0 md:p-0",
        "max-md:m-0 max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:max-w-none max-md:rounded-none max-md:border-0",
        "md:max-h-[calc(100dvh-2rem)] md:max-w-4xl",
      )}
    >
      {/* 머리 */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
        <div>
          <h2 id={titleId} className="text-body font-semibold text-fg">채널 분석 리포트</h2>
          <p className="tnum mt-0.5 text-caption text-fg-3">
            검색 결과 {videos.length}개 영상 · {channels.length}개 채널
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" className={cx(BTN_GHOST, "-mr-2 size-11 shrink-0")}>
          <CloseIcon size={20} />
        </button>
      </div>

      {/* 표 */}
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        <table className="w-full border-separate border-spacing-0 text-left text-body-sm">
          <caption className="sr-only">채널별 구독자 · 영상 수 · 평균 조회수</caption>
          <thead>
            <tr>
              <th scope="col" className={cx(RTH, "w-10")}>#</th>
              <th scope="col" className={RTH}>채널</th>
              <th scope="col" className={cx(RTH, "whitespace-nowrap text-right")}>구독자</th>
              <th scope="col" className={cx(RTH, "whitespace-nowrap text-right")}>영상 수</th>
              <th scope="col" className={cx(RTH, "whitespace-nowrap text-right")}>평균 조회수</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, idx) => (
              <tr key={ch.channelId} className="transition-colors duration-150 hover:bg-surface-3/40">
                <td className={cx(RTD, "tnum text-micro text-fg-3")}>{idx + 1}</td>
                <td className={RTD}>
                  <a
                    href={`https://www.youtube.com/channel/${ch.channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2.5 text-fg-1 transition-colors hover:text-fg"
                  >
                    {ch.channelThumbnail ? (
                      <img
                        src={ch.channelThumbnail}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        decoding="async"
                        className="size-7 shrink-0 rounded-full bg-surface-3 object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="block size-7 shrink-0 rounded-full bg-surface-3" />
                    )}
                    <span className="line-clamp-1 font-medium">{ch.channelTitle}</span>
                    <svg className="ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                    <span className="sr-only">(새 창)</span>
                  </a>
                </td>
                <td className={cx(RTD, "tnum text-right text-fg-2")}>{formatCompactKo(ch.subscriberCountRaw)}</td>
                <td className={cx(RTD, "tnum text-right font-semibold text-fg")}>{ch.videoCount}</td>
                <td className={cx(RTD, "tnum whitespace-nowrap text-right text-fg-2")}>{formatCompactKo(ch.avgViews)}회</td>
              </tr>
            ))}
          </tbody>
        </table>

        {channels.length === 0 && <p className="py-16 text-center text-body-sm text-fg-3">데이터 없음</p>}
      </div>
    </Dialog>
  );
}
