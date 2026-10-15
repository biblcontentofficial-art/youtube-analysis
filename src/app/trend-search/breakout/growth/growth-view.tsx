/**
 * A3 성장 추적 화면(props 만 받음, 데이터·인증 호출 없음). 데이터는 src/lib/trend/growth.ts 의 getGrowth.
 * 근거: docs/trend-dev/spec.md 3.3 · 1.3 · DESIGN.md 6.6 칩 · 6.10 표/목록 · 6.12 태그 · 6.13 상태 상자 · 6.15 .ext · 6.20 빈 상태
 *
 *   <GrowthView data={result} />                     탭 페이지(섹션 머리 + 탭 줄 + 본문)
 *   <GrowthSection data={result} heading="h2" />     본문만(정보 구조를 안 B·C 로 바꿀 때 다른 페이지에 넣는다). 행 제목은 heading 보다 한 단계 아래
 *
 * - 날짜 칩: 7일 값이 있으면 날짜만, 3일 값까지면 '· 3일까지', 다음 날 값만 있으면 '· 다음 날만'.
 * - 1024 이상 표(영상 · 다음 날 · 3일 뒤 · 7일 뒤 · 흐름), 미만 목록('1.2만 → 3.4만 → 8.1만 · 꾸준히 성장').
 * - 칸마다 cellState(값, 잰 시각): 값 / '측정 전'(아직 안 잼) / '비공개·삭제'(쟀는데 응답에서 빠짐), 둘 다 fg-4.
 *   다음 날 칸만 예외: 다음 날 값이 없는데 3일·7일을 이미 쟀으면 앞으로도 생기지 않으므로 '기록 없음'.
 * - 흐름은 색 없는 태그(6.12 기본). 7일 증가 배수 ▲ 는 GROWTH_SHOW_MULTIPLIER(2배) 이상일 때만 positive 글자.
 * - 흰색·화살표는 실제로 순서를 정한 열(7일 뒤 · 다음 날, 7일 값이 없는 날짜면 3일 뒤)의 숫자에만. 제목·채널은 유튜브로 나가는 링크(.ext, 새 창).
 * - 정렬 기준 상위 50개만 그린다(전체가 더 많으면 표 위 캡션 '정렬 기준 상위 50개').
 * - 빈 상태(empty)는 6.20 상자, 불러오기 실패(error)는 6.13 오류 상자. 7일 값이 아직 없으면 표 위 6.13 안내 상자에 첫 7일 날짜.
 * - 칩 주소는 기본값(롱폼 · 7일 증가 배수순)을 빼고 만든다. 미리보기는 basePath 에 자기 주소를 넘긴다.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { CHIP } from "@/components/ui/chip";
import { cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { InfoIcon, WarningIcon } from "@/components/ui/icons";
import { DerivedNotice } from "@/components/ui/notice";
import { NUM, ROW, TABLE, TD, TH, TH_SORT, TH_SORT_ACTIVE } from "@/components/ui/table";
import { GROWTH_LIMIT, GROWTH_SHOW_MULTIPLIER, SHORTS_MAX_SEC, cellState, classifyFlow, growthMultiplier, type Flow } from "@/lib/trend/rules";
import {
  GROWTH_FORMATS,
  GROWTH_SORTS,
  type GrowthDate,
  type GrowthFormat,
  type GrowthResult,
  type GrowthRow,
  type GrowthSort,
} from "@/lib/trend/growth";
import { BreakoutTabs, ScrollToCurrentNav } from "../_components/BreakoutTabs";

const PAGE_PATH = "/trend-search/breakout/growth";

/** 섹션 설명(spec 3.3). 스켈레톤(loading.tsx)도 같은 글자를 그려 줄바꿈·높이를 실제와 맞춘다 */
export const GROWTH_DESC = "같은 영상을 게시 다음 날, 3일 뒤, 7일 뒤 아침에 다시 잰 조회수입니다. 꾸준히 크는 영상과 초반에만 몰린 영상을 나눠 봅니다.";

const FORMAT_LABEL: Record<GrowthFormat, string> = { long: "롱폼", shorts: "쇼츠" };
const SORT_LABEL: Record<GrowthSort, string> = { growth: "7일 증가 배수순", v7: "7일 조회수순", v1: "다음 날 조회수순" };
const FLOW_LABEL: Record<"steady" | "early", string> = { steady: "꾸준히 성장", early: "초반 집중" };

/** 정렬 기준 숫자(DESIGN 6.10 앱 표, 브레이크아웃 영상 탭과 같은 값) */
const SORT_NUM = "text-[18px] font-extrabold tracking-[-0.02em] text-fg";
/** 측정 전 · 비공개·삭제 · 기록 없음(작은 글자 하한 fg-4) */
const MUTED = "text-caption text-fg-4";

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const channelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;

/** 화면 숫자 표기(브레이크아웃 영상 탭 num() 과 같은 규칙: 6.2만 · 8,200) */
function num(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(n >= 1_000_000_000 ? 0 : 1).replace(/\.0$/, "")}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}만`;
  return n.toLocaleString("ko-KR");
}

function dur(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x: number) => String(x).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

/** '2026-10-14' → '10월 14일 (화)' (브레이크아웃 영상 탭 날짜 칩과 같은 표기) */
function dateLabel(d: string): string {
  const [, m, day] = d.split("-");
  const w = "일월화수목금토"[new Date(`${d}T12:00:00+09:00`).getUTCDay()];
  return `${Number(m)}월 ${Number(day)}일 (${w})`;
}

/** '2026-10-21' → '10월 21일' */
function monthDay(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(m)}월 ${Number(day)}일`;
}

function chipSuffix(d: GrowthDate): string | null {
  if (d.hasD7) return null;
  return d.hasD3 ? "3일까지" : "다음 날만";
}

/** 칩 주소. 기본값(롱폼 · 7일 증가 배수순)은 쿼리에서 뺀다. basePath 에 이미 쿼리가 있으면 이어 붙인다 */
function chipHref(basePath: string, cur: { date: string | null; format: GrowthFormat; sort: GrowthSort }, patch: Partial<{ date: string; format: GrowthFormat; sort: GrowthSort }>): string {
  const next = { ...cur, ...patch };
  const params = new URLSearchParams();
  if (next.date) params.set("date", next.date);
  if (next.format !== GROWTH_FORMATS[0]) params.set("format", next.format);
  if (next.sort !== GROWTH_SORTS[0]) params.set("sort", next.sort);
  const qs = params.toString();
  if (!qs) return basePath;
  return `${basePath}${basePath.includes("?") ? "&" : "?"}${qs}`;
}

/** 유튜브로 나가는 ↗(DESIGN 6.15 .ext: 평소 무채색, 링크 hover·포커스 때만 유튜브 빨강) */
function ExtIcon() {
  return (
    <svg className="ext ml-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/** 6.13 안내 상자(기호 fg-2, 면 칠하지 않음) */
function InfoBox({ title, body, className }: { title: string; body: ReactNode; className?: string }) {
  return (
    <div role="status" className={cx("flex gap-3 rounded-card border border-line bg-surface p-4", className)}>
      <InfoIcon className="mt-0.5 shrink-0 text-fg-2" />
      <div className="min-w-0">
        <p className="text-ui font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-body-sm text-fg-3">{body}</p>
      </div>
    </div>
  );
}

/** 6.13 오류 상자(기호와 제목만 negative, 면 칠하지 않음) */
function ErrorBox({ className }: { className?: string }) {
  return (
    <div role="status" className={cx("flex gap-3 rounded-card border border-line bg-surface p-4", className)}>
      <WarningIcon className="mt-0.5 shrink-0 text-negative" />
      <div className="min-w-0">
        <p className="text-ui font-semibold text-negative">데이터를 불러오지 못했습니다.</p>
        <p className="mt-0.5 text-body-sm text-fg-3">잠시 뒤 새로고침해 주세요.</p>
      </div>
    </div>
  );
}

/** 6.20 빈 상태(목록 자리 안) */
function EmptyBox({ title, body, className }: { title: string; body: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8", className)}>
      <div>
        <p className="text-ui font-semibold text-fg">{title}</p>
        <p className="mt-1 text-body-sm text-fg-3">{body}</p>
      </div>
    </div>
  );
}

/** 안내 상자 설명. 날짜('10월 18일')는 좁은 화면에서도 한 줄에 두어 '10월 / 18일'로 갈라지지 않게 한다 */
function pendingBody(firstD7: string | null): ReactNode {
  return (
    <>
      게시 3일 뒤부터 값이 생깁니다.
      {firstD7 ? (
        <>
          {" "}첫 7일 값은 <span className="whitespace-nowrap">{monthDay(firstD7)}</span> 아침에 나옵니다.
        </>
      ) : null}
    </>
  );
}

/** 다음 날 칸이 '기록 없음'인가: 다음 날 값을 복사하지 못했는데 3일·7일은 이미 쟀다(앞으로도 생기지 않는다) */
function d1Missing(r: GrowthRow): boolean {
  return r.m1 == null && (r.m3 != null || r.m7 != null);
}

/** 칸 하나의 글자(값 · 측정 전 · 비공개·삭제 · 기록 없음) */
function Cell({ v, m, missing, strong }: { v: number | null; m: string | null; missing?: boolean; strong?: boolean }) {
  const st = cellState(v, m);
  if (st === "value") return <span className={strong ? SORT_NUM : "text-body-sm text-fg-2"}>{num(v!)}</span>;
  if (missing) return <span className={MUTED}>기록 없음</span>;
  return <span className={MUTED}>{st === "pending" ? "측정 전" : "비공개·삭제"}</span>;
}

/** 7일 증가 배수 '4.1배'. v1·v7 둘 다 있고 기준 이상일 때만 */
function multiplierLabel(r: GrowthRow): string | null {
  const x = growthMultiplier(r.v1, r.v7);
  return x != null && x >= GROWTH_SHOW_MULTIPLIER ? `${x.toFixed(1).replace(/\.0$/, "")}배` : null;
}

function Up({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cx("tnum font-semibold text-positive", className)}>
      <span aria-hidden="true">▲ </span>
      <span className="sr-only">7일 증가 </span>
      {label}
    </span>
  );
}

/** 흐름 칸: 꾸준히 성장·초반 집중은 색 없는 태그, 측정 전·비공개·삭제는 fg-4 글자, 그 밖은 비움 */
function FlowMark({ flow }: { flow: Flow | null }) {
  if (flow === "steady" || flow === "early") return <span className={badgeClass()}>{FLOW_LABEL[flow]}</span>;
  if (flow === "pending") return <span className={MUTED}>측정 전</span>;
  if (flow === "gone") return <span className={MUTED}>비공개·삭제</span>;
  return null;
}

function Thumb({ r, className }: { r: GrowthRow; className: string }) {
  return (
    <a href={watchUrl(r.videoId)} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className={cx("relative shrink-0 overflow-hidden rounded-control bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.thumbnail ?? `https://i.ytimg.com/vi/${r.videoId}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
      <span className="tnum absolute bottom-1 right-1 rounded bg-canvas/80 px-1 py-0.5 text-micro font-semibold">
        {r.durationSec <= SHORTS_MAX_SEC ? "쇼츠" : dur(r.durationSec)}
      </span>
    </a>
  );
}

/** 목록 한 칸 글자(값 · 측정 전 · 비공개·삭제 · 기록 없음). 정렬 기준 값만 흰색 굵게 */
function ListValue({ v, m, missing, strong }: { v: number | null; m: string | null; missing?: boolean; strong?: boolean }) {
  const st = cellState(v, m);
  if (st === "value") return <span className={strong ? "text-body-sm font-extrabold tracking-[-0.02em] text-fg" : "text-fg-2"}>{num(v!)}</span>;
  return <span className="text-fg-4">{missing ? "기록 없음" : st === "pending" ? "측정 전" : "비공개·삭제"}</span>;
}

type SortCol = "v1" | "v3" | "v7";

/**
 * 실제로 순서를 정한 열. sortGrowthRows 는 정렬 키가 모두 null 이면 7일 → 3일 → 다음 날 값으로 넘어가므로
 * 그 열에 화살표·흰 숫자를 둔다(예: 7일 값이 아직 없는 날짜의 '7일 증가 배수순'은 3일 뒤 조회수순).
 * 증가 배수가 모두 비어도 7일 값이 있으면 7일 뒤 열 그대로다.
 */
function effectiveSortCol(rows: GrowthRow[], sort: GrowthSort): SortCol {
  const chain: SortCol[] = sort === "v1" ? ["v1", "v7", "v3"] : ["v7", "v3", "v1"];
  return chain.find((c) => rows.some((r) => r[c] != null)) ?? chain[0];
}

/**
 * 표(1024 이상) + 목록(1024 미만) + 캡션·파생값 안내.
 * rowHeading: 행 제목 태그(섹션 제목보다 한 단계 아래).

 * 흐름 열 오른쪽 pr-14: 카카오 플로팅 버튼(right-6 size-14)이 1024~1375 폭에서 마지막 열 글자를 가리지 않게 비워 둔다(다른 탭 표와 같은 값).
 */
function GrowthList({ data, basePath, rowHeading: RH }: { data: GrowthResult; basePath: string; rowHeading: "h2" | "h3" }) {
  const cur = { date: data.date, format: data.format, sort: data.sort };
  const col = effectiveSortCol(data.rows, data.sort);
  const d7Active = col === "v7";
  const d3Active = col === "v3";
  const d1Active = col === "v1";
  const arrow = <span aria-hidden="true"> ↓</span>;
  const sortHead = (key: "v1" | "v7", label: string, active: boolean) => (
    <Link href={chipHref(basePath, cur, { sort: key })} className={cx(TH_SORT, active && TH_SORT_ACTIVE)}>
      {label}{active ? arrow : null}
    </Link>
  );
  return (
    <div>
      <table className={cx(TABLE, "hidden lg:table")}>
        <thead>
          <tr>
            <th scope="col" className={TH}>영상</th>
            <th scope="col" aria-sort={d1Active ? "descending" : undefined} className={cx(TH, "w-[112px] text-right")}>{sortHead("v1", "다음 날", d1Active)}</th>
            <th scope="col" aria-sort={d3Active ? "descending" : undefined} className={cx(TH, "w-[112px] text-right")}>
              <span className={cx("inline-flex h-10 items-center pointer-coarse:h-11", d3Active && TH_SORT_ACTIVE)}>3일 뒤{d3Active ? arrow : null}</span>
            </th>
            <th scope="col" aria-sort={d7Active ? "descending" : undefined} className={cx(TH, "w-[128px] text-right")}>{sortHead("v7", "7일 뒤", d7Active)}</th>
            <th scope="col" className={cx(TH, "w-[176px] pl-8 pr-14")}>흐름</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => {
            const x = multiplierLabel(r);
            return (
              <tr key={r.videoId} className={ROW}>
                <td className={cx(TD, "pr-6")}>
                  <div className="flex items-center gap-4">
                    <Thumb r={r} className="w-32 xl:w-36" />
                    <div className="min-w-0 flex-1">
                      <RH className="text-ui font-medium leading-[1.5] text-fg-1">
                        <a href={watchUrl(r.videoId)} target="_blank" rel="noopener noreferrer" className="line-clamp-2 transition-colors duration-150 hover:text-fg">
                          {r.title}<ExtIcon /><span className="sr-only"> (새 창)</span>
                        </a>
                      </RH>
                      {r.channelTitle ? (
                        <a href={channelUrl(r.channelId)} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-caption text-fg-3 transition-colors duration-150 hover:text-fg">{r.channelTitle}</a>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className={cx(TD, NUM)}><Cell v={r.v1} m={r.m1} missing={d1Missing(r)} strong={d1Active} /></td>
                <td className={cx(TD, NUM)}><Cell v={r.v3} m={r.m3} strong={d3Active} /></td>
                <td className={cx(TD, NUM)}>
                  <Cell v={r.v7} m={r.m7} strong={d7Active} />
                  {x ? <span className="mt-0.5 block text-caption"><Up label={x} /></span> : null}
                </td>
                <td className={cx(TD, "pl-8 pr-14")}><FlowMark flow={classifyFlow(r)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="lg:hidden">
        <p className="-mx-6 border-y border-line px-6 py-2 text-micro text-fg-3">조회수: 다음 날 → 3일 뒤 → 7일 뒤</p>
        <ul className="-mx-6 divide-y divide-line-soft border-b border-line">
          {data.rows.map((r) => {
            const x = multiplierLabel(r);
            const flow = classifyFlow(r);
            const label = flow === "steady" || flow === "early" ? FLOW_LABEL[flow] : null;
            return (
              <li key={r.videoId} className="flex gap-3 px-6 py-4">
                <Thumb r={r} className="w-28 self-start md:w-44" />
                <div className="min-w-0 flex-1">
                  <RH className="text-ui font-medium leading-[1.5] text-fg-1 md:text-body">
                    <a href={watchUrl(r.videoId)} target="_blank" rel="noopener noreferrer" className="line-clamp-2">
                      {r.title}<ExtIcon /><span className="sr-only"> (새 창)</span>
                    </a>
                  </RH>
                  {r.channelTitle ? (
                    <a href={channelUrl(r.channelId)} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-micro text-fg-3">{r.channelTitle}</a>
                  ) : null}
                  <p className="tnum mt-0.5 flex flex-wrap items-baseline gap-x-1 text-micro text-fg-3">
                    <span className="whitespace-nowrap"><ListValue v={r.v1} m={r.m1} missing={d1Missing(r)} strong={d1Active} /> <span aria-hidden="true">→</span><span className="sr-only">, 3일 뒤</span></span>
                    <span className="whitespace-nowrap"><ListValue v={r.v3} m={r.m3} strong={d3Active} /> <span aria-hidden="true">→</span><span className="sr-only">, 7일 뒤</span></span>
                    {/* 구분점은 앞 항목 끝에 붙인다(줄이 넘어가도 다음 줄 맨 앞에 · 가 오지 않게) */}
                    <span className="whitespace-nowrap"><ListValue v={r.v7} m={r.m7} strong={d7Active} />{x || label ? " ·" : null}</span>
                    {x ? <span className="whitespace-nowrap"><Up label={x} />{label ? " ·" : null}</span> : null}
                    {label ? <span className="whitespace-nowrap">{label}</span> : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <DerivedNotice what="증가 배수와 흐름 구분은" className="mt-3" />
      <p className="mt-1 text-micro text-fg-3">n일 뒤는 게시 시각이 아니라 게시 날짜 기준으로 잰 값이라 최대 하루 차이가 있습니다. 기록은 30일 동안만 보관합니다.</p>
    </div>
  );
}

/** 상태에 맞는 본문(칩 줄 아래) */
function Body({ data, basePath, rowHeading }: { data: GrowthResult; basePath: string; rowHeading: "h2" | "h3" }) {
  if (data.state === "error") return <ErrorBox className="mt-6" />;
  if (data.state === "empty") return <EmptyBox className="mt-6" title="추적 기록이 쌓이는 중입니다." body={pendingBody(data.firstD7)} />;
  return (
    <>
      {data.firstD7 ? <InfoBox className="mt-6" title="추적 기록이 쌓이는 중입니다." body={pendingBody(data.firstD7)} /> : null}
      {data.rows.length ? (
        <div className="mt-6">
          {data.total > GROWTH_LIMIT ? <p className="mb-2 text-caption text-fg-3">정렬 기준 상위 {GROWTH_LIMIT}개</p> : null}
          <GrowthList data={data} basePath={basePath} rowHeading={rowHeading} />
        </div>
      ) : (
        <EmptyBox
          className="mt-6"
          title="이 날짜에 추적한 영상이 없습니다."
          body={data.format === "shorts" ? "롱폼으로 바꿔 보세요." : "쇼츠로 바꿔 보세요."}
        />
      )}
    </>
  );
}

/** 칩 묶음 사이 세로 선(640 이상) */
function Divider() {
  return <span aria-hidden="true" className="hidden h-5 w-px bg-line sm:block" />;
}

/** 본문(제목·설명·기준 줄·칩·표나 상태 상자). 섹션 머리·탭 줄은 그리지 않는다 */
export function GrowthSection({
  data,
  basePath = PAGE_PATH,
  heading = "h1",
}: {
  data: GrowthResult;
  /** 칩 주소의 앞부분(미리보기는 자기 주소를 넘긴다) */
  basePath?: string;
  heading?: "h1" | "h2";
}) {
  const H = heading;
  const cur = { date: data.date, format: data.format, sort: data.sort };
  return (
    <section aria-labelledby="growth-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <H id="growth-title" className="text-h3 md:text-h2">성장 추적</H>
          <p className="mt-2 text-ui text-fg-2 md:text-body">{GROWTH_DESC}</p>
        </div>
        {data.state === "ok" && data.date ? (
          <p className="text-body-sm text-fg-3">
            {dateLabel(data.date)} 게시 · <span className="tnum font-semibold text-fg">{data.total.toLocaleString("ko-KR")}</span>개
          </p>
        ) : null}
      </div>

      {data.state === "ok" && data.dates.length > 0 ? (
        <ScrollToCurrentNav current={data.date} label="게시 날짜" className="scrollbar-hide -mx-6 mt-8 flex gap-1.5 overflow-x-auto px-6 pb-1 lg:mx-0 lg:px-0">
          {data.dates.map((d) => {
            const suffix = chipSuffix(d);
            return (
              <Link key={d.date} href={chipHref(basePath, cur, { date: d.date })} aria-current={d.date === data.date ? "page" : undefined} className={CHIP}>
                {dateLabel(d.date)}
                {suffix ? <span className="text-fg-3">· {suffix}</span> : null}
              </Link>
            );
          })}
        </ScrollToCurrentNav>
      ) : null}

      <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-2", data.state === "ok" && data.dates.length > 0 ? "mt-4" : "mt-8")}>
        <nav aria-label="영상 길이" className="flex gap-1.5">
          {GROWTH_FORMATS.map((f) => (
            <Link key={f} href={chipHref(basePath, cur, { format: f })} aria-current={f === data.format ? "page" : undefined} className={CHIP}>{FORMAT_LABEL[f]}</Link>
          ))}
        </nav>
        <Divider />
        <nav aria-label="정렬" className="flex flex-wrap gap-1.5">
          {GROWTH_SORTS.map((s) => (
            <Link key={s} href={chipHref(basePath, cur, { sort: s })} aria-current={s === data.sort ? "page" : undefined} className={CHIP}>{SORT_LABEL[s]}</Link>
          ))}
        </nav>
        <Divider />
        <p className="text-caption text-fg-3">뉴스·홈쇼핑·정치·이슈 채널은 빼고 셉니다</p>
      </div>

      <Body data={data} basePath={basePath} rowHeading={heading === "h1" ? "h2" : "h3"} />
    </section>
  );
}

/** 탭 페이지 전체(로그인 확인 뒤). 로컬 미리보기에서도 재사용한다 */
export function GrowthView({ data, basePath, badge }: { data: GrowthResult; basePath?: string; badge?: number }) {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="GROWTH" />
        <BreakoutTabs current="growth" badge={badge} />
        <GrowthSection data={data} basePath={basePath} />
      </div>
    </main>
  );
}
