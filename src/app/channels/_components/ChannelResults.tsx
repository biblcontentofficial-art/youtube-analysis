"use client";

/**
 * 채널 찾기 결과 (정렬은 브라우저에서).
 *
 * page.tsx 가 받은 검색 결과를 정렬하지 않고 넘기면, 주소의 sort·dateOrder 로 여기서 줄 세운다.
 * 탭·토글을 바꿔도 서버를 다시 부르지 않으므로 채널 검색 횟수가 다시 차감되지 않는다.
 *
 * 화면(DESIGN 6.10 앱 표 · 3.1 기능 색):
 * - 768 이상 표(table.ts 공용 상수), 768 미만 행 카드(1행 썸네일·이름·핸들, 2행 구독자 · 핵심 지표).
 * - 지표 등급은 무채색 단계 + 등급 글자(grade.ts). 개설 3년 이내 채널은 positive 'NEW' 태그. 표 아래 범례 한 줄.
 * - 정렬 중인 열 머리는 흰 600 + 화살표 + aria-sort. 정렬 바꾸기는 위 정렬 탭이 맡는다.
 */
import { useMemo } from "react";
import Link from "next/link";
import type { ChannelResult } from "@/lib/youtube";
import { channelAgeMonths, sortChannels, type SortMode } from "@/lib/channelSort";
import { formatKstDate } from "@/lib/kst";
import { formatCompactKo } from "@/lib/format";
import { TABLE, TH, TD, NUM, ROW, TH_SORT_ACTIVE } from "@/components/ui/table";
import { badgeClass } from "@/components/ui/badge";
import { cx } from "@/components/ui/button";
import { isPlainLeftClick, rememberDetailFromList, useChannelSort } from "./listState";
import { GRADE_LABEL, GRADE_TONE, gradeLegend, gradeLevel, type GradeMetric } from "./grade";

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function formatOpenDate(publishedAt: string): string {
  if (!publishedAt) return "-";
  // 한국 시간 날짜. 서버 렌더와 하이드레이션이 같은 값을 낸다.
  return formatKstDate(publishedAt);
}

// 컬럼 레이블 (결정 12 기본 C: 이름·계산 그대로)
const metricLabel: Record<SortMode, string> = {
  trending: "영상당 평균 조회",
  growth: "월 구독자 증가",
  new: "영상당 평균 조회",
};

// 탭별 핵심 지표의 등급 기준
const metricKind: Record<SortMode, GradeMetric> = {
  trending: "viewPerSub",
  growth: "monthlySubs",
  new: "avgViews",
};

/** 상단 정렬 기준 한 줄. 검색 결과가 있을 때만 page.tsx 가 그린다. */
export function ChannelSortCaption() {
  const { sort, dateOrder } = useChannelSort();
  return (
    <p className="text-caption text-fg-3">
      {sort === "trending" && "영상당 평균 조회수 기준"}
      {sort === "growth" && "채널 나이 대비 월 평균 구독자 증가량 기준"}
      {sort === "new" && !dateOrder && "3년 이내 개설 채널 우선 · 영상당 평균 조회수 기준"}
      {sort === "new" && dateOrder === "desc" && "채널 개설일 최신순"}
      {sort === "new" && dateOrder === "asc" && "채널 개설일 오래된순"}
    </p>
  );
}

interface Props {
  /** 서버가 받은 순서 그대로의 검색 결과 (최대 25개) */
  channels: ChannelResult[];
  query: string;
  /** 채널 나이 기준 시각(ms). 서버가 한 번 정해 넘긴다. */
  now: number;
}

type Row = {
  ch: ChannelResult;
  isNew: boolean;
  metricText: string;
  metricValue: number;
  href: string;
  detailPath: string;
};

function Avatar({ ch, size }: { ch: ChannelResult; size: "sm" | "md" }) {
  const box = size === "md" ? "size-10" : "size-9";
  return ch.thumbnail ? (
    <img src={ch.thumbnail} alt="" className={cx(box, "shrink-0 rounded-full bg-surface-2 object-cover")} loading="lazy" decoding="async" />
  ) : (
    <span aria-hidden="true" className={cx(box, "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-3 text-body-sm font-semibold text-fg-2")}>
      {ch.title.slice(0, 1)}
    </span>
  );
}

export default function ChannelResults({ channels: items, query, now }: Props) {
  const { sort, dateOrder } = useChannelSort();
  const channels = useMemo(
    () => sortChannels(items, sort, dateOrder, now),
    [items, sort, dateOrder, now]
  );

  if (channels.length === 0) return null;

  const kind = metricKind[sort];
  const from = encodeURIComponent(
    `/channels?q=${encodeURIComponent(query)}&sort=${sort}${dateOrder ? `&dateOrder=${dateOrder}` : ""}`
  );

  const rows: Row[] = channels.map((ch) => {
    const ageM = channelAgeMonths(ch.publishedAt, now);
    const viralRatio = Math.round(ch.viewCount / Math.max(ch.subscriberCount, 1));
    const spm = Math.round(ch.subscriberCount / Math.max(ageM, 1));
    const metricValue = sort === "trending" ? viralRatio : sort === "growth" ? spm : ch.avgViewsPerVideo;
    const metricText =
      sort === "trending"
        ? `${formatCompactKo(viralRatio)}배`
        : sort === "growth"
          ? `+${formatCompactKo(spm)}/월`
          : `${formatCompactKo(ch.avgViewsPerVideo)}회`;
    const detailPath = `/channels/${ch.channelId}`;
    return { ch, isNew: ageM <= 36, metricText, metricValue, detailPath, href: `${detailPath}?from=${from}` };
  });

  const newCount = rows.filter((r) => r.isNew).length;
  // 정렬 중인 열: 개설일 정렬이 켜져 있으면 개설일, 아니면 핵심 지표
  const sortedByDate = sort === "new" && dateOrder !== null;
  const dateAria = sortedByDate ? (dateOrder === "asc" ? "ascending" : "descending") : undefined;

  const linkProps = (r: Row) => ({
    href: r.href,
    // 정렬을 바꾸면 href 가 바뀐다. 미리 가져오기를 끄면 탭 클릭이 서버 요청을 만들지 않는다.
    prefetch: false,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isPlainLeftClick(e)) rememberDetailFromList(r.detailPath);
    },
  });

  const newTag = <span className={badgeClass("success")}>NEW</span>;

  return (
    <section aria-label="채널 검색 결과">
      {/* 신생 채널 탭 안내 (개설일 정렬 중에는 위 정렬 기준 줄이 같은 내용을 말한다) */}
      {sort === "new" && !dateOrder && (
        <p className="mb-3 text-body-sm text-fg-3">
          {newCount > 0 ? (
            <>
              3년 이내 신생 채널 <span className="tnum font-semibold text-fg">{newCount}</span>개가 상단에 표시됩니다
            </>
          ) : (
            "이 키워드에서 3년 이내 신생 채널이 없어 전체를 평균 조회수 순으로 표시합니다."
          )}
        </p>
      )}

      {/* ─── 768 이상: 표 ─────────────────────────────────────────────────── */}
      <table className={cx(TABLE, "hidden md:table")}>
        <thead>
          <tr>
            <th scope="col" className={cx(TH, "w-12 pl-1")}>
              <span className="sr-only">순위</span>
              <span aria-hidden="true">#</span>
            </th>
            <th scope="col" className={TH}>채널</th>
            <th scope="col" className={cx(TH, "w-28 text-right")}>구독자 수</th>
            <th
              scope="col"
              // 신생 탭(개설일 정렬 꺼짐)은 신생 채널이 먼저라 이 열의 내림차순과 순서가 같지 않다
              aria-sort={sortedByDate || sort === "new" ? undefined : "descending"}
              className={cx(TH, "w-40 text-right", !sortedByDate && TH_SORT_ACTIVE)}
            >
              <span className="inline-flex h-10 items-center gap-1">
                {metricLabel[sort]}
                {!sortedByDate && <span aria-hidden="true">↓</span>}
              </span>
            </th>
            <th scope="col" className={cx(TH, "hidden w-24 text-right lg:table-cell")}>영상 수</th>
            <th
              scope="col"
              aria-sort={dateAria}
              className={cx(TH, "w-28 text-right", sortedByDate && TH_SORT_ACTIVE)}
            >
              <span className="inline-flex h-10 items-center gap-1">
                채널 개설일
                {sortedByDate && <span aria-hidden="true">{dateOrder === "asc" ? "↑" : "↓"}</span>}
              </span>
            </th>
            <th scope="col" className={cx(TH, "hidden w-72 pl-6 xl:table-cell")}>설명</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const level = gradeLevel(kind, r.metricValue);
            return (
              <tr key={r.ch.channelId} className={ROW}>
                <td className={cx(TD, "pl-1 tnum text-caption text-fg-3")}>{i + 1}</td>
                <td className={TD}>
                  <Link {...linkProps(r)} className="group flex min-w-0 items-center gap-3 rounded-md py-1">
                    <Avatar ch={r.ch} size="md" />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-ui font-semibold text-fg-1 transition-colors group-hover:text-fg-2">
                          {r.ch.title}
                        </span>
                        {r.isNew && newTag}
                      </span>
                      {r.ch.customUrl && (
                        <span className="mt-0.5 block truncate text-caption text-fg-3">{r.ch.customUrl}</span>
                      )}
                      {r.ch.topicTags.length > 0 && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {r.ch.topicTags.map((tag) => (
                            <span key={tag} className={badgeClass()}>{tag}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                <td className={cx(TD, NUM, "text-body-sm font-semibold text-fg-1")}>
                  {formatCompactKo(r.ch.subscriberCount)}
                </td>
                <td className={cx(TD, NUM)}>
                  <span className={cx("block text-body-sm", GRADE_TONE[level])}>{r.metricText}</span>
                  <span className={cx("block text-micro", GRADE_TONE[level])}>{GRADE_LABEL[level]}</span>
                </td>
                <td className={cx(TD, NUM, "hidden text-body-sm text-fg-2 lg:table-cell")}>
                  {r.ch.videoCount.toLocaleString("ko-KR")}개
                </td>
                <td className={cx(TD, NUM, "text-body-sm text-fg-3")}>{formatOpenDate(r.ch.publishedAt)}</td>
                <td className={cx(TD, "hidden pl-6 text-caption text-fg-3 xl:table-cell")}>
                  <p className="line-clamp-2">{r.ch.description}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ─── 768 미만: 행 카드 ─────────────────────────────────────────────── */}
      <ol className="-mx-6 divide-y divide-line-soft border-y border-line md:hidden">
        {rows.map((r, i) => {
          const level = gradeLevel(kind, r.metricValue);
          return (
            <li key={r.ch.channelId}>
              <Link {...linkProps(r)} className="flex gap-3 px-6 py-4 transition-colors hover:bg-surface-2/55">
                <span aria-hidden="true" className="tnum w-5 shrink-0 pt-2.5 text-caption text-fg-3">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar ch={r.ch} size="sm" />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-ui font-semibold text-fg-1">{r.ch.title}</span>
                        {r.isNew && newTag}
                      </span>
                      {r.ch.customUrl && (
                        <span className="block truncate text-micro text-fg-3">{r.ch.customUrl}</span>
                      )}
                    </span>
                  </span>
                  <span className="tnum mt-2 flex flex-wrap items-baseline gap-x-1.5 text-micro text-fg-3">
                    <span>
                      구독자 <span className="text-body-sm font-semibold text-fg-1">{formatCompactKo(r.ch.subscriberCount)}</span>
                    </span>
                    <span aria-hidden="true" className="text-fg-4">·</span>
                    <span>
                      {metricLabel[sort]}{" "}
                      <span className={cx("text-body-sm", GRADE_TONE[level])}>{r.metricText}</span>{" "}
                      <span className={GRADE_TONE[level]}>{GRADE_LABEL[level]}</span>
                    </span>
                    {sortedByDate && (
                      <>
                        <span aria-hidden="true" className="text-fg-4">·</span>
                        <span>개설 {formatOpenDate(r.ch.publishedAt)}</span>
                      </>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* 범례 한 줄 (색만으로 말하지 않게 등급 글자를 함께 쓴다) */}
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-3">
        <span className="font-semibold text-fg-2">{metricLabel[sort]} 등급</span>
        {gradeLegend(kind).map((g) => (
          <span key={g.level} className={cx("whitespace-nowrap", GRADE_TONE[g.level])}>
            {g.text}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {newTag} 개설 3년 이내
        </span>
      </p>
    </section>
  );
}
