/**
 * A1 급상승 키워드 데이터(서버 전용). 화면은 keywords-view.tsx(props 만 받음), 규칙 상수는 rules.ts,
 * RPC 는 supabase/migrations/trend_dev.sql 의 trend_rising_window · trend_rising_terms.
 *
 *   const result = await getRisingTerms({});
 *   result.state  // rising | top | sparse | none | empty | error
 *
 * 가로 롱폼 전용(소유자 결정 2026-10-16: 쇼츠·세로·라이브 제외). breakout_terms 는 terms 단계가 가로 롱폼만 써 두고,
 * RPC 에는 언제나 p_format 'long' 을 넘긴다(trend_longform_only.sql 적용 전에는 기간 통계가 길이 180초 초과로만 거른다).
 *
 * 상태 판정 순서(spec 3.1):
 *  ① trend_rising_window 로 기간 통계(단어가 0개여도 1행). 실패면 error. 수집 날짜 0이면 empty.
 *     최근 7일 수집 일수 < MIN_RECENT_DAYS 면 sparse.
 *  ② 이전 7일 수집 일수 < MIN_PRIOR_DAYS 면 p_mode 'top', 아니면 'rising' 으로 trend_rising_terms 한 번.
 *     실패면 error, 0행이면 none.
 *  ③ 대표 영상: 단어마다 sample_video_ids 앞 2개를 모아 breakout_videos 에서 in() 한 번(최대 100개).
 *     이 조회가 실패해도 표는 그린다(썸네일은 영상 id 로 만든 주소, 제목 없음).
 *
 * 쿼리: 기준 날짜 getBreakoutDates(1)(오늘부터 거꾸로 head count, 보통 1~2회) + rpc 2회 + in() 1회.
 * RPC 오류를 '데이터 없음'으로 삼키는 db.ts 의 rpc() 를 쓰지 않고 오류를 직접 본다(오류 상자와 빈 상태를 가르기 위해).
 */
import { getSupabase } from "@/lib/supabase";
import { getBreakoutDates, kstToday } from "@/lib/breakout";
import {
  MIN_PRIOR_DAYS,
  MIN_RECENT_CHANNELS,
  MIN_RECENT_DAYS,
  RISING_LIMIT,
  SHORTS_MAX_SEC,
  TOP_MAX_DAY_RATIO,
  TOP_MIN_HIST_DAYS,
} from "./rules";

export type RisingState = "rising" | "top" | "sparse" | "none" | "empty" | "error";
export type RisingMode = "rising" | "top";

/** 기간 통계. recent = end-6 ~ end, prior = end-13 ~ end-7 */
export type RisingWindow = {
  /** 기준 날짜(마지막 수집일) 'YYYY-MM-DD' */
  end: string;
  /** 최근 7일 첫날 'YYYY-MM-DD' (end-6) */
  start: string;
  recentDays: number;
  priorDays: number;
  /** end-29 ~ end 수집 일수(상시어 판정용) */
  histDays: number;
  /** terms 를 부른 방식. sparse·empty 면 null */
  mode: RisingMode | null;
};

export type RisingSample = { videoId: string; title: string | null; channelTitle: string | null; thumbnail: string };

export type RisingRow = {
  term: string;
  termType: "word" | "tag";
  recentChannels: number;
  priorChannels: number;
  samples: RisingSample[];
};

export type RisingResult = {
  state: RisingState;
  window: RisingWindow | null;
  rows: RisingRow[];
};

type WindowRow = { recent_days: number; prior_days: number; recent_total: number; prior_total: number; hist_days: number };
type TermsRow = {
  term: string;
  term_type: string;
  recent_channels: number;
  prior_channels: number;
  sample_video_ids: string[] | null;
};
type VideoRow = { video_id: string; title: string | null; channel_title: string | null; thumbnail: string | null; snapshot_date: string };

/** 단어 하나에 보이는 대표 영상 수(표·목록 모두 2장) */
const SAMPLES_PER_TERM = 2;
/** in() 한 번에 넣는 영상 id 상한 */
const MAX_SAMPLE_IDS = 100;

/** 'YYYY-MM-DD' 에서 days 만큼 이동 */
function shiftDate(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400_000).toISOString().slice(0, 10);
}

function thumbOf(id: string): string {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

/** 언제나 가로 롱폼(RPC p_format) */
const FORMAT = "long";

export async function getRisingTerms({ end }: { end?: string } = {}): Promise<RisingResult> {
  const db = getSupabase();
  if (!db) {
    console.error("[trend/rising] supabase 환경 변수가 없습니다");
    return { state: "error", window: null, rows: [] };
  }

  // 기준 날짜: 마지막 수집일. 수집일을 못 찾으면 어제(한국)로 기간 통계를 받아 empty·sparse 를 가른다
  const endDate = end ?? (await getBreakoutDates(1))[0] ?? kstToday(-1);

  // ① 기간 통계
  const w = await db.rpc("trend_rising_window", { p_end: endDate, p_format: FORMAT, p_shorts_max: SHORTS_MAX_SEC });
  if (w.error) {
    console.error("[trend/rising] rpc trend_rising_window error:", w.error.message);
    return { state: "error", window: null, rows: [] };
  }
  const stat = ((Array.isArray(w.data) ? w.data[0] : w.data) ?? null) as WindowRow | null;
  const window: RisingWindow = {
    end: endDate,
    start: shiftDate(endDate, -6),
    recentDays: Number(stat?.recent_days ?? 0),
    priorDays: Number(stat?.prior_days ?? 0),
    histDays: Number(stat?.hist_days ?? 0),
    mode: null,
  };
  if (window.histDays === 0) {
    return { state: "empty", window, rows: [] };
  }
  if (window.recentDays < MIN_RECENT_DAYS) {
    return { state: "sparse", window, rows: [] };
  }

  // ② 단어 목록(한 번)
  const mode: RisingMode = window.priorDays < MIN_PRIOR_DAYS ? "top" : "rising";
  window.mode = mode;
  const t = await db.rpc("trend_rising_terms", {
    p_end: endDate,
    p_format: FORMAT,
    p_mode: mode,
    p_min_recent: MIN_RECENT_CHANNELS,
    p_limit: RISING_LIMIT,
    p_shorts_max: SHORTS_MAX_SEC,
    p_max_day_ratio: TOP_MAX_DAY_RATIO,
    p_min_hist_days: TOP_MIN_HIST_DAYS,
  });
  if (t.error) {
    console.error("[trend/rising] rpc trend_rising_terms error:", t.error.message);
    return { state: "error", window, rows: [] };
  }
  const terms = ((t.data ?? []) as TermsRow[]).filter((r) => r && typeof r.term === "string");
  if (terms.length === 0) return { state: "none", window, rows: [] };

  // ③ 대표 영상 한 번에
  const pick = terms.map((r) => (r.sample_video_ids ?? []).filter(Boolean).slice(0, SAMPLES_PER_TERM));
  const ids = [...new Set(pick.flat())].slice(0, MAX_SAMPLE_IDS);
  const videos = new Map<string, VideoRow>();
  if (ids.length) {
    const v = await db
      .from("breakout_videos")
      .select("video_id,title,channel_title,thumbnail,snapshot_date")
      .in("video_id", ids)
      .lte("snapshot_date", endDate)
      .gt("snapshot_date", shiftDate(endDate, -14))
      .order("snapshot_date", { ascending: false })
      .limit(1000);
    if (v.error) console.error("[trend/rising] breakout_videos samples error:", v.error.message);
    for (const row of (v.data ?? []) as VideoRow[]) {
      if (!videos.has(row.video_id)) videos.set(row.video_id, row); // 최근 수집 행 먼저
    }
  }

  const rows: RisingRow[] = terms.map((r, i) => ({
    term: r.term,
    termType: r.term_type === "tag" ? "tag" : "word",
    recentChannels: Number(r.recent_channels ?? 0),
    priorChannels: Number(r.prior_channels ?? 0),
    samples: pick[i].filter((id) => ids.includes(id)).map((id) => {
      const row = videos.get(id);
      return { videoId: id, title: row?.title ?? null, channelTitle: row?.channel_title ?? null, thumbnail: row?.thumbnail ?? thumbOf(id) };
    }),
  }));

  return { state: mode, window, rows };
}
