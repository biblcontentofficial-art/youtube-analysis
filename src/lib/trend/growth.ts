/**
 * A3 성장 추적 데이터(서버 전용). 화면은 src/app/trend-search/breakout/growth/growth-view.tsx(props 만 받음),
 * RPC 는 supabase/migrations/trend_dev.sql 의 trend_growth_dates · trend_growth. 기록은 cron views_d1·track 이 채운다(track.ts).
 *
 *   const q = parseGrowthQuery(searchParams);   // 잘못된 값은 기본값(날짜 자동 · 롱폼 · 7일 증가 배수순)
 *   const result = await getGrowth(q);
 *   result.state  // ok | empty | error
 *
 * - 날짜 칩: trend_growth_dates(p_since = 오늘-30). 처음 열 때 날짜 = has_d7 인 가장 최근, 없으면 가장 최근(defaultGrowthDate).
 * - 정렬: 7일 증가 배수(v7 ÷ v1) · 7일 조회수 · 다음 날 조회수. 값이 없는(null) 영상은 뒤로. 같으면 7일 → 3일 → 다음 날 조회수 → id.
 *   정렬 뒤 상위 GROWTH_LIMIT(50)개만 돌려주고 total 에 전체 수를 둔다.
 * - RPC 오류를 '데이터 없음'으로 삼키는 db.ts 의 rpc() 를 쓰지 않고 오류를 직접 본다(오류 상자와 빈 상태를 가르기 위해).
 * - 정렬·기본 날짜·첫 7일 날짜는 순수 함수(buildGrowthResult)라 미리보기 고정 데이터와 시험이 같은 코드를 쓴다.
 *   Node 직접 시험을 위해 상대 경로 import 만 쓴다.
 */
import { getSupabase } from "../supabase";
import { kstDate } from "./jobs";
import { GROWTH_LIMIT, SHORTS_MAX_SEC, growthMultiplier } from "./rules";

export type GrowthFormat = "long" | "shorts";
export type GrowthSort = "growth" | "v7" | "v1";
export type GrowthState = "ok" | "empty" | "error";

/** 허용 값(그 밖은 첫 값 = 기본값). 화면 칩도 이 순서로 그린다 */
export const GROWTH_FORMATS: readonly GrowthFormat[] = ["long", "shorts"];
export const GROWTH_SORTS: readonly GrowthSort[] = ["growth", "v7", "v1"];

/** 날짜 칩 범위(오늘-30 이후) */
export const GROWTH_DATE_DAYS = 30;

export type GrowthQuery = { date: string | null; format: GrowthFormat; sort: GrowthSort };

export type GrowthDate = { date: string; hasD3: boolean; hasD7: boolean };

export type GrowthRow = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string | null;
  durationSec: number;
  publishedAt: string | null;
  v1: number | null;
  v3: number | null;
  v7: number | null;
  m1: string | null;
  m3: string | null;
  m7: string | null;
};

export type GrowthResult = {
  state: GrowthState;
  format: GrowthFormat;
  sort: GrowthSort;
  /** 고른 게시 날짜. 날짜가 없으면 null */
  date: string | null;
  dates: GrowthDate[];
  /** 정렬 기준 상위 GROWTH_LIMIT 개 */
  rows: GrowthRow[];
  /** 고른 날짜·길이의 전체 영상 수(자르기 전) */
  total: number;
  /** 아직 7일 값이 하나도 없을 때 첫 7일 값이 나올 날(아침). 7일 값이 있으면 null */
  firstD7: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pick<T extends string>(raw: string | undefined, allowed: readonly T[]): T {
  return allowed.find((v) => v === raw) ?? allowed[0];
}

/** 주소 쿼리 → 조건. 날짜는 형식만 본다(칩 목록에 없으면 buildGrowthResult 가 기본 날짜로 바꾼다) */
export function parseGrowthQuery(sp: { date?: string; format?: string; sort?: string }): GrowthQuery {
  return {
    date: sp.date && DATE_RE.test(sp.date) ? sp.date : null,
    format: pick(sp.format, GROWTH_FORMATS),
    sort: pick(sp.sort, GROWTH_SORTS),
  };
}

/** 처음 열 때 날짜: has_d7 인 가장 최근 날짜, 없으면 가장 최근 날짜 */
export function defaultGrowthDate(dates: GrowthDate[]): string | null {
  const desc = [...dates].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return desc.find((d) => d.hasD7)?.date ?? desc[0]?.date ?? null;
}

function shift(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}

/**
 * 첫 7일 값이 나올 날. 7일 값이 이미 있으면 null.
 * 가장 이른 추적 날짜(없으면 어제) + 7일, 단 내일보다 이르지 않게(오늘 아침이 이미 지났으면 다음 기회는 내일 아침).
 */
export function firstD7Date(dates: GrowthDate[], today: string): string | null {
  if (dates.some((d) => d.hasD7)) return null;
  const earliest = dates.length ? dates.map((d) => d.date).sort()[0] : shift(today, -1);
  const d7 = shift(earliest, 7);
  const tomorrow = shift(today, 1);
  return d7 < tomorrow ? tomorrow : d7;
}

/** null 은 언제나 뒤로 */
function desc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

/** 정렬(새 배열). growth = 7일 증가 배수, v7 = 7일 조회수, v1 = 다음 날 조회수 */
export function sortGrowthRows(rows: GrowthRow[], sort: GrowthSort): GrowthRow[] {
  const key = (r: GrowthRow) => (sort === "growth" ? growthMultiplier(r.v1, r.v7) : sort === "v7" ? r.v7 : r.v1);
  return [...rows].sort(
    (a, b) =>
      desc(key(a), key(b)) ||
      desc(a.v7, b.v7) ||
      desc(a.v3, b.v3) ||
      desc(a.v1, b.v1) ||
      (a.videoId < b.videoId ? -1 : a.videoId > b.videoId ? 1 : 0),
  );
}

/** 순수 조립: 날짜 목록 + 고른 날짜의 행 → 화면 결과. 미리보기 고정 데이터도 이 함수를 쓴다 */
export function buildGrowthResult({
  q,
  dates,
  rows,
  today,
}: {
  q: GrowthQuery;
  dates: GrowthDate[];
  /** 고른 날짜·길이의 행(정렬 전) */
  rows: GrowthRow[];
  today: string;
}): GrowthResult {
  const date = resolveGrowthDate(q, dates);
  const sorted = sortGrowthRows(rows, q.sort);
  return {
    state: dates.length ? "ok" : "empty",
    format: q.format,
    sort: q.sort,
    date,
    dates,
    rows: sorted.slice(0, GROWTH_LIMIT),
    total: rows.length,
    firstD7: firstD7Date(dates, today),
  };
}

/** 주소의 날짜가 칩 목록에 있으면 그 날짜, 아니면 기본 날짜 */
export function resolveGrowthDate(q: GrowthQuery, dates: GrowthDate[]): string | null {
  return q.date && dates.some((d) => d.date === q.date) ? q.date : defaultGrowthDate(dates);
}

type DateRow = { snapshot_date: string; has_d3: boolean | null; has_d7: boolean | null };
type Row = {
  video_id: string;
  title: string | null;
  channel_id: string | null;
  channel_title: string | null;
  thumbnail: string | null;
  duration_sec: number | null;
  published_at: string | null;
  v1: number | string | null;
  v3: number | string | null;
  v7: number | string | null;
  m1: string | null;
  m3: string | null;
  m7: string | null;
};

const n = (v: number | string | null): number | null => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

function errorResult(q: GrowthQuery, dates: GrowthDate[] = [], date: string | null = null): GrowthResult {
  return { state: "error", format: q.format, sort: q.sort, date, dates, rows: [], total: 0, firstD7: null };
}

/** 날짜 칩 목록(최근 날짜 먼저). 실패면 null */
export async function getGrowthDates(today = kstDate(Date.now(), 0)): Promise<GrowthDate[] | null> {
  const db = getSupabase();
  if (!db) {
    console.error("[trend/growth] supabase 환경 변수가 없습니다");
    return null;
  }
  const r = await db.rpc("trend_growth_dates", { p_since: shift(today, -GROWTH_DATE_DAYS), p_limit: GROWTH_DATE_DAYS + 1 });
  if (r.error) {
    console.error("[trend/growth] rpc trend_growth_dates error:", r.error.message);
    return null;
  }
  return ((r.data ?? []) as DateRow[])
    .filter((x) => x && typeof x.snapshot_date === "string")
    .map((x) => ({ date: String(x.snapshot_date).slice(0, 10), hasD3: Boolean(x.has_d3), hasD7: Boolean(x.has_d7) }));
}

/** 쿼리: rpc trend_growth_dates 1회 + (날짜가 있으면) rpc trend_growth 1회 */
export async function getGrowth(input: GrowthQuery): Promise<GrowthResult> {
  // 호출하는 쪽이 타입 밖 값을 넘겨도 기본값으로
  const q = parseGrowthQuery({ date: input.date ?? undefined, format: input.format, sort: input.sort });
  const today = kstDate(Date.now(), 0);
  const dates = await getGrowthDates(today);
  if (!dates) return errorResult(q);

  const date = resolveGrowthDate(q, dates);
  if (!date) return buildGrowthResult({ q, dates, rows: [], today });

  const db = getSupabase();
  if (!db) return errorResult(q, dates, date);
  const r = await db.rpc("trend_growth", { p_date: date, p_format: q.format, p_shorts_max: SHORTS_MAX_SEC });
  if (r.error) {
    console.error("[trend/growth] rpc trend_growth error:", r.error.message);
    return errorResult(q, dates, date);
  }

  const rows: GrowthRow[] = ((r.data ?? []) as Row[])
    .filter((x) => x && typeof x.video_id === "string")
    .map((x) => ({
      videoId: x.video_id,
      title: x.title ?? "",
      channelId: x.channel_id ?? "",
      channelTitle: x.channel_title ?? "",
      thumbnail: x.thumbnail ?? null,
      durationSec: Number(x.duration_sec ?? 0),
      publishedAt: x.published_at ?? null,
      v1: n(x.v1),
      v3: n(x.v3),
      v7: n(x.v7),
      m1: x.m1 ?? null,
      m3: x.m3 ?? null,
      m7: x.m7 ?? null,
    }));

  return buildGrowthResult({ q: { ...q, date }, dates, rows, today });
}
