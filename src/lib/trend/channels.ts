/**
 * A2 지금 크는 채널 데이터(서버 전용). 화면은 channels-view.tsx(props 만 받음),
 * RPC 는 supabase/migrations/trend_dev.sql 의 trend_recurring_channels.
 *
 *   const q = parseChannelQuery(searchParams);          // 잘못된 값은 기본값(14일 · 전체 · 10만 미만)
 *   const result = await getRecurringChannels(q);
 *   result.state  // ok | empty | error
 *
 * - 최근 14/30일 브레이크아웃(집계 대상 행: kind 없음, 분류 칼럼 전 수집 행 제외)에 서로 다른 날짜
 *   CHANNEL_MIN_DAYS 일 이상 오른, 구독자 상한 미만 채널. API 비용 0(DB 집계 한 번).
 * - 기준 날짜(end)는 마지막 수집일. 기간은 end-days+1 ~ end.
 * - 구독자 수는 그 채널의 가장 최근 수집 행 값(날짜마다 다를 수 있다, 화면 캡션에 적는다).
 * - RPC 오류를 '데이터 없음'으로 삼키는 db.ts 의 rpc() 를 쓰지 않고 오류를 직접 본다(오류 상자와 빈 상태를 가르기 위해).
 *
 * 쿼리: 기준 날짜 getBreakoutDates(1)(오늘부터 거꾸로 head count, 보통 1~2회) + rpc 1회.
 */
import { getSupabase } from "@/lib/supabase";
import { getBreakoutDates, kstToday } from "@/lib/breakout";
import { SHORTS_MAX_SEC } from "./rules";

export type ChannelDays = 14 | 30;
export type ChannelFormat = "all" | "long" | "shorts";
export type ChannelMaxSubs = 100_000 | 10_000;
export type ChannelState = "ok" | "empty" | "error";

/** 허용 값(그 밖은 첫 값 = 기본값). 화면 칩도 이 순서로 그린다 */
export const CHANNEL_DAYS: readonly ChannelDays[] = [14, 30];
export const CHANNEL_FORMATS: readonly ChannelFormat[] = ["all", "long", "shorts"];
export const CHANNEL_MAX_SUBS: readonly ChannelMaxSubs[] = [100_000, 10_000];

/** A2: 서로 다른 수집 날짜 하한. 소유자 결정 2026-10-15: 2일 이상 */
export const CHANNEL_MIN_DAYS = 2;
/** A2: 한 번에 보이는 최대 채널 수 */
export const CHANNEL_LIMIT = 50;

/** 채널명이 비었을 때 화면에 보이는 이름 */
export const UNNAMED_CHANNEL = "이름 없는 채널";

export type ChannelQuery = { days: ChannelDays; format: ChannelFormat; maxSubs: ChannelMaxSubs };

export type RecurringChannel = {
  channelId: string;
  channelTitle: string;
  channelThumb: string | null;
  /** 가장 최근 수집 행의 구독자 수 */
  subscriberCount: number;
  /** 서로 다른 수집 날짜 수 */
  days: number;
  /** 기간 안 브레이크아웃 영상 수 */
  videos: number;
  /** 마지막으로 오른 날 'YYYY-MM-DD' */
  lastDate: string;
  /** 가장 최근 날짜에서 조회수가 가장 많은 영상 */
  latestVideoId: string | null;
  latestTitle: string | null;
};

export type RecurringResult = ChannelQuery & {
  state: ChannelState;
  /** 기준 날짜(마지막 수집일) 'YYYY-MM-DD'. 기준 날짜를 정하기 전 실패면 null */
  end: string | null;
  /** 기간 첫날 'YYYY-MM-DD' (end-days+1) */
  start: string | null;
  rows: RecurringChannel[];
};

type Row = {
  channel_id: string;
  channel_title: string | null;
  channel_thumb: string | null;
  subscriber_count: number | string | null;
  days: number | null;
  videos: number | null;
  last_date: string;
  latest_video_id: string | null;
  latest_title: string | null;
};

function pick<T extends string | number>(raw: string | undefined, allowed: readonly T[]): T {
  return allowed.find((v) => String(v) === raw) ?? allowed[0];
}

/** 주소 쿼리 → 조건. days=999 처럼 허용 밖 값은 기본값(14 · all · 100000) */
export function parseChannelQuery(sp: { days?: string; format?: string; subs?: string }): ChannelQuery {
  return {
    days: pick(sp.days, CHANNEL_DAYS),
    format: pick(sp.format, CHANNEL_FORMATS),
    maxSubs: pick(sp.subs, CHANNEL_MAX_SUBS),
  };
}

/** 'YYYY-MM-DD' 에서 days 만큼 이동 */
function shiftDate(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400_000).toISOString().slice(0, 10);
}

export async function getRecurringChannels({ end, days, format, maxSubs }: ChannelQuery & { end?: string }): Promise<RecurringResult> {
  // 호출하는 쪽이 타입 밖 값을 넘겨도 기본값으로(주소 쿼리를 그대로 넘기는 실수 방지)
  const q = parseChannelQuery({ days: String(days), format, subs: String(maxSubs) });
  const db = getSupabase();
  if (!db) {
    console.error("[trend/channels] supabase 환경 변수가 없습니다");
    return { ...q, state: "error", end: null, start: null, rows: [] };
  }

  const endDate = end ?? (await getBreakoutDates(1))[0] ?? kstToday(-1);
  const start = shiftDate(endDate, -(q.days - 1));

  const r = await db.rpc("trend_recurring_channels", {
    p_end: endDate,
    p_days: q.days,
    p_max_subs: q.maxSubs,
    p_min_days: CHANNEL_MIN_DAYS,
    p_format: q.format,
    p_limit: CHANNEL_LIMIT,
    p_shorts_max: SHORTS_MAX_SEC,
  });
  if (r.error) {
    console.error("[trend/channels] rpc trend_recurring_channels error:", r.error.message);
    return { ...q, state: "error", end: endDate, start, rows: [] };
  }

  const rows: RecurringChannel[] = ((r.data ?? []) as Row[])
    .filter((x) => x && typeof x.channel_id === "string")
    .map((x) => ({
      channelId: x.channel_id,
      // 이름이 비면 화면 링크·아바타 첫 글자가 비지 않게 대신 이름을 넣는다
      channelTitle: x.channel_title?.trim() || UNNAMED_CHANNEL,
      channelThumb: x.channel_thumb ?? null,
      subscriberCount: Number(x.subscriber_count ?? 0),
      days: Number(x.days ?? 0),
      videos: Number(x.videos ?? 0),
      lastDate: String(x.last_date).slice(0, 10),
      latestVideoId: x.latest_video_id ?? null,
      latestTitle: x.latest_title ?? null,
    }));

  return { ...q, state: rows.length ? "ok" : "empty", end: endDate, start, rows };
}
