"use client";

/**
 * 채널 찾기 결과 (정렬은 브라우저에서).
 *
 * page.tsx 가 받은 검색 결과를 정렬하지 않고 넘기면, 주소의 sort·dateOrder 로 여기서 줄 세운다.
 * 탭·토글을 바꿔도 서버를 다시 부르지 않으므로 채널 검색 횟수가 다시 차감되지 않는다.
 * 마크업은 page.tsx 에서 옮긴 것이다(색만 neutral 로 바꿈, 화면 구성 변경은 R19).
 */
import { useMemo } from "react";
import Link from "next/link";
import type { ChannelResult } from "@/lib/youtube";
import { channelAgeMonths, sortChannels, type SortMode } from "@/lib/channelSort";
import { formatKstDate } from "@/lib/kst";
import { isPlainLeftClick, rememberDetailFromList, useChannelSort } from "./listState";

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function formatOpenDate(publishedAt: string): string {
  if (!publishedAt) return "-";
  // 한국 시간 날짜. 서버 렌더와 하이드레이션이 같은 값을 낸다.
  return formatKstDate(publishedAt);
}

function fmtNum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("ko-KR");
}

// ─── 지표 색상 ─────────────────────────────────────────────────────────────────

function metricColor(val: number, hi: number, mid: number, lo: number): string {
  if (val >= hi) return "text-purple-400 font-bold";
  if (val >= mid) return "text-red-400 font-semibold";
  if (val >= lo) return "text-orange-400 font-semibold";
  return "text-neutral-300";
}

// 컬럼 레이블
const metricLabel: Record<SortMode, string> = {
  trending: "영상당 평균 조회",
  growth: "월 구독자 증가",
  new: "영상당 평균 조회",
};

/** 상단 필터 줄의 정렬 기준 한 줄. 검색 결과가 있을 때만 page.tsx 가 그린다. */
export function ChannelSortCaption() {
  const { sort, dateOrder } = useChannelSort();
  return (
    <span className="text-xs text-neutral-500 hidden md:block">
      {sort === "trending" && "영상당 평균 조회수 기준"}
      {sort === "growth" && "채널 나이 대비 월 평균 구독자 증가량 기준"}
      {sort === "new" && !dateOrder && "3년 이내 개설 채널 우선 · 영상당 평균 조회수 기준"}
      {sort === "new" && dateOrder === "desc" && "채널 개설일 최신순"}
      {sort === "new" && dateOrder === "asc" && "채널 개설일 오래된순"}
    </span>
  );
}

interface Props {
  /** 서버가 받은 순서 그대로의 검색 결과 (최대 25개) */
  channels: ChannelResult[];
  query: string;
  /** 채널 나이 기준 시각(ms). 서버가 한 번 정해 넘긴다. */
  now: number;
}

export default function ChannelResults({ channels: items, query, now }: Props) {
  const { sort, dateOrder } = useChannelSort();
  const channels = useMemo(
    () => sortChannels(items, sort, dateOrder, now),
    [items, sort, dateOrder, now]
  );

  return (
    <>
      {/* 신생 고성장 안내 */}
      {sort === "new" && channels.length > 0 && (() => {
        if (dateOrder) {
          return (
            <p className="text-xs mb-4 text-neutral-400">
              {dateOrder === "desc"
                ? "📅 채널 개설일 최신순으로 정렬됩니다"
                : "📅 채널 개설일 오래된순으로 정렬됩니다"}
            </p>
          );
        }
        const n = channels.filter((ch) => channelAgeMonths(ch.publishedAt, now) <= 36).length;
        return (
          <p className={`text-xs mb-4 ${n > 0 ? "text-green-500" : "text-neutral-500"}`}>
            {n > 0
              ? `🌱 3년 이내 신생 채널 ${n}개가 상단에 표시됩니다`
              : "이 키워드에서 3년 이내 신생 채널이 없어 전체를 평균 조회수 순으로 표시합니다."}
          </p>
        );
      })()}

      {/* ─── 결과 테이블 ─────────────────────────────────────────────────── */}
      {channels.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm border-collapse">
            {/* 헤더 */}
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-500 text-xs">
                <th className="px-5 py-3 text-left w-8 font-normal">#</th>
                <th className="px-4 py-3 text-left font-normal">채널</th>
                <th className="px-4 py-3 text-right font-normal whitespace-nowrap">
                  <span className={sort === "growth" || sort === "trending" ? "text-white" : ""}>
                    구독자 수
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-normal whitespace-nowrap">
                  <span className={sort === "trending" ? "text-white flex items-center justify-end gap-1" : "flex items-center justify-end gap-1"}>
                    {metricLabel[sort]}
                    <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 12L2 5h12L8 12z"/>
                    </svg>
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-normal whitespace-nowrap hidden md:table-cell">
                  영상 수
                </th>
                <th className="px-4 py-3 text-right font-normal whitespace-nowrap hidden md:table-cell">
                  채널 개설일
                </th>
                <th className="px-4 py-3 text-left font-normal hidden lg:table-cell">
                  설명
                </th>
              </tr>
            </thead>

            {/* 바디 */}
            <tbody>
              {channels.map((ch, i) => {
                const ageM = channelAgeMonths(ch.publishedAt, now);
                const isNew = ageM <= 36;
                const viralRatio = Math.round(ch.viewCount / Math.max(ch.subscriberCount, 1));
                const spm = Math.round(ch.subscriberCount / Math.max(ageM, 1));
                const detailPath = `/channels/${ch.channelId}`;

                return (
                  <tr
                    key={ch.channelId}
                    className={`border-b border-neutral-800/60 transition-colors group
                      ${isNew && sort === "new"
                        ? "bg-green-950/10 hover:bg-green-950/20"
                        : "hover:bg-neutral-800/30"
                      }`}
                  >
                    {/* 순위 */}
                    <td className="px-5 py-4 text-neutral-500 text-xs font-mono align-middle">
                      {i + 1}
                    </td>

                    {/* 채널 정보 */}
                    <td className="px-4 py-4 align-middle">
                      <Link
                        href={`${detailPath}?from=${encodeURIComponent(`/channels?q=${encodeURIComponent(query)}&sort=${sort}${dateOrder ? `&dateOrder=${dateOrder}` : ""}`)}`}
                        // 정렬을 바꾸면 href 가 바뀐다. 미리 가져오기를 끄면 탭 클릭이 서버 요청을 만들지 않는다.
                        prefetch={false}
                        onClick={(e) => {
                          if (isPlainLeftClick(e)) rememberDetailFromList(detailPath);
                        }}
                        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                      >
                        {/* 썸네일 */}
                        <div className="relative shrink-0">
                          {ch.thumbnail ? (
                            <img
                              src={ch.thumbnail}
                              alt={ch.title}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-700 group-hover:ring-neutral-500 transition"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl ring-2 ring-neutral-700">
                              📺
                            </div>
                          )}
                          {isNew && (
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* 이름 + 태그 */}
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate max-w-[200px] group-hover:text-neutral-300 transition">
                            {ch.title}
                          </p>
                          {ch.customUrl && (
                            <p className="text-neutral-500 text-xs truncate mt-0.5">{ch.customUrl}</p>
                          )}
                          {/* 카테고리 태그 */}
                          {ch.topicTags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {ch.topicTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>

                    {/* 구독자 */}
                    <td className="px-4 py-4 text-right align-middle whitespace-nowrap">
                      <span className="text-neutral-200 font-semibold tabular-nums">
                        {ch.subscriberCountFormatted}
                      </span>
                    </td>

                    {/* 핵심 지표 */}
                    <td className="px-4 py-4 text-right align-middle whitespace-nowrap">
                      {sort === "trending" && (
                        <span className={metricColor(viralRatio, 200, 80, 30) + " tabular-nums"}>
                          {fmtNum(viralRatio)}배
                        </span>
                      )}
                      {sort === "growth" && (
                        <span className={metricColor(spm, 50000, 10000, 3000) + " tabular-nums"}>
                          +{fmtNum(spm)}/월
                        </span>
                      )}
                      {sort === "new" && (
                        <span className={metricColor(ch.avgViewsPerVideo, 500000, 100000, 30000) + " tabular-nums"}>
                          {fmtNum(ch.avgViewsPerVideo)}회
                        </span>
                      )}
                    </td>

                    {/* 영상 수 */}
                    <td className="px-4 py-4 text-right text-neutral-400 whitespace-nowrap hidden md:table-cell align-middle tabular-nums">
                      {ch.videoCount.toLocaleString("ko-KR")}개
                    </td>

                    {/* 채널 개설일 */}
                    <td className="px-4 py-4 text-right whitespace-nowrap hidden md:table-cell align-middle">
                      <span className={`text-xs tabular-nums ${isNew ? "text-green-400" : "text-neutral-500"}`}>
                        {formatOpenDate(ch.publishedAt)}
                      </span>
                    </td>

                    {/* 설명 */}
                    <td className="px-4 py-4 text-neutral-500 text-xs hidden lg:table-cell align-middle max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{ch.description}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
