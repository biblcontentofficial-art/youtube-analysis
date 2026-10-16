/**
 * cron 단계 notify(C7 관심 키워드·채널 알림, roadmap T9). 테이블은 supabase/migrations/trend_dev.sql 의
 * watch_keywords · watch_channels · notifications. 매칭 규칙은 notify-match.ts(순수).
 *
 * runNotify(date, { dry })
 *   1. 그날 breakout_videos 를 range() 로 끝까지 읽는다. 집계 대상 행이 하나도 없으면 skipped(no_breakout_rows)
 *      (jobs.ts 따라잡기 규칙과 같다. 분류 칼럼 전 수집 행은 matchVideo 가 키워드·채널 모두 뺀다).
 *      가로 롱폼 전용(소유자 결정 2026-10-16): 쇼츠·세로·라이브 영상(isLongFormRow 아님)은 키워드·채널 모두 알림을 만들지 않는다.
 *   2. watch_keywords · watch_channels 전부를 range() 로 읽어 term_norm → 사용자, channel_id → 사용자 지도를 만든다.
 *   3. 영상마다 matchVideo(전체 키워드 집합·전체 채널 집합) 한 번 → 걸린 키워드·채널의 사용자에게 알림 행.
 *      같은 사용자·영상·종류(keyword|channel)는 한 줄(키워드가 여럿 걸리면 정렬 순 첫 키워드).
 *   4. dry 가 아니면 notifications 에 500개씩 insert on conflict (user_id, video_id, kind) do nothing.
 *      같은 날짜를 다시 돌려도 행이 늘지 않는다(unique 제약 notifications_once_uq).
 *   30일 지난 알림 삭제는 여기서 하지 않는다(독립 단계 purge, jobs.ts).
 *   detail { videos, watchers, users, matched, inserted | would_insert, ms }
 *
 * 메모리 매칭 규모: 키워드 1만 개 × 영상 400개 = 400만 번 includes 수준까지는 1초 안팎. 그 이상이면 term_norm 인덱스로
 * DB 쪽 매칭으로 바꾼다(roadmap T9 risks).
 *
 * 읽기는 db.ts 의 selectAllPaged 대신 오류를 던지는 range() 반복을 쓴다: selectAllPaged 는 오류 때 조용히 멈춰 일부만 읽고
 * 단계가 ok 로 남아, 놓친 알림을 따라잡기가 다시 만들지 않는다.
 * 시험: scripts/trend/notify.test.mjs(createNotify 에 모의 저장소를 넣는다). Node 직접 시험을 위해 상대 경로 import 만 쓴다.
 */
import { getSupabase } from "../supabase";
import { isCountedRow, isLongFormRow } from "./rules";
import { matchVideo, type MatchVideo } from "./notify-match";
import type { StepDef, StepOutcome } from "./jobs";

/** breakout_videos 에서 읽는 칼럼 */
export type NotifySourceRow = MatchVideo & {
  video_id: string;
  /** long | shorts | vertical | live. 칼럼 추가 전 수집분은 null(그때는 길이로 판정) */
  video_format: string | null;
  duration_sec: number | null;
  channel_title: string | null;
  thumbnail: string | null;
  view_count: number | null;
};

export type WatchKeywordRow = { user_id: string; term: string; term_norm: string };
export type WatchChannelRow = { user_id: string; channel_id: string };

/** notifications 한 행(id·read_at·created_at 은 DB 기본값) */
export type NotificationInsert = {
  user_id: string;
  kind: "keyword" | "channel";
  term: string | null;
  channel_id: string | null;
  video_id: string;
  snapshot_date: string;
  title: string | null;
  thumbnail: string | null;
  channel_title: string | null;
  view_count: number | null;
};

/** DB 접근(시험에서는 모의 객체로 바꾼다) */
export interface NotifyStore {
  videos(date: string): Promise<NotifySourceRow[]>;
  keywords(): Promise<WatchKeywordRow[]>;
  channels(): Promise<WatchChannelRow[]>;
  /** insert on conflict (user_id, video_id, kind) do nothing. 새로 들어간 행 수 */
  insertIgnore(rows: NotificationInsert[]): Promise<number>;
}

/** notifications 한 번에 넣는 행 수 */
export const NOTIFY_CHUNK = 500;

function addTo(map: Map<string, Set<string>>, key: string, user: string) {
  let s = map.get(key);
  if (!s) map.set(key, (s = new Set()));
  s.add(user);
}

/** 순수 계산: 그날 영상(가로 롱폼만 본다) + 관심 목록 → 알림 행(사용자·영상·종류마다 한 줄, 정렬된 순서) */
export function buildNotifications(date: string, videos: NotifySourceRow[], keywords: WatchKeywordRow[], channels: WatchChannelRow[]): NotificationInsert[] {
  const usersByTerm = new Map<string, Set<string>>();
  const display = new Map<string, string>(); // `${user}\0${term_norm}` → 사용자가 입력한 표기
  for (const k of keywords) {
    if (!k.term_norm) continue;
    addTo(usersByTerm, k.term_norm, k.user_id);
    display.set(`${k.user_id}\u0000${k.term_norm}`, k.term || k.term_norm);
  }
  const usersByChannel = new Map<string, Set<string>>();
  for (const c of channels) if (c.channel_id) addTo(usersByChannel, c.channel_id, c.user_id);

  const sets = { keywords: new Set(usersByTerm.keys()), channels: new Set(usersByChannel.keys()) };
  const out = new Map<string, NotificationInsert>();
  const base = (v: NotifySourceRow) => ({
    video_id: v.video_id,
    snapshot_date: date,
    channel_id: v.channel_id,
    title: v.title,
    thumbnail: v.thumbnail,
    channel_title: v.channel_title,
    view_count: v.view_count,
  });

  for (const v of videos) {
    if (!isLongFormRow(v)) continue;
    const hits = matchVideo(v, sets);
    for (const h of hits) {
      if (h.kind === "keyword") {
        // 정렬 순 첫 키워드가 그 사용자의 알림 이유(같은 영상에 키워드가 여럿 걸려도 한 줄)
        for (const user of usersByTerm.get(h.term) ?? []) {
          const key = `${user}\u0000${v.video_id}\u0000keyword`;
          if (out.has(key)) continue;
          out.set(key, { user_id: user, kind: "keyword", term: display.get(`${user}\u0000${h.term}`) ?? h.term, ...base(v) });
        }
      } else {
        for (const user of usersByChannel.get(v.channel_id ?? "") ?? []) {
          const key = `${user}\u0000${v.video_id}\u0000channel`;
          if (out.has(key)) continue;
          out.set(key, { user_id: user, kind: "channel", term: null, ...base(v) });
        }
      }
    }
  }
  return [...out.values()].sort((a, b) => (a.user_id < b.user_id ? -1 : a.user_id > b.user_id ? 1 : a.video_id < b.video_id ? -1 : a.video_id > b.video_id ? 1 : a.kind < b.kind ? -1 : 1));
}

export function createNotify({ store, now = () => Date.now() }: { store: () => NotifyStore; now?: () => number }) {
  async function runNotify(date: string, { dry }: { dry: boolean }): Promise<StepOutcome> {
    const started = now();
    const s = store();
    const videos = await s.videos(date);
    if (!videos.some(isCountedRow)) return { status: "skipped", detail: "no_breakout_rows" };

    const [keywords, channels] = await Promise.all([s.keywords(), s.channels()]);
    const watchers = new Set([...keywords.map((k) => k.user_id), ...channels.map((c) => c.user_id)]).size;
    const rows = buildNotifications(date, videos, keywords, channels);
    const detail: Record<string, unknown> = {
      videos: videos.length,
      videos_long: videos.filter(isLongFormRow).length,
      watchers,
      users: new Set(rows.map((r) => r.user_id)).size,
      matched: rows.length,
    };

    if (dry) {
      detail.would_insert = rows.length;
    } else {
      let inserted = 0;
      for (let i = 0; i < rows.length; i += NOTIFY_CHUNK) inserted += await s.insertIgnore(rows.slice(i, i + NOTIFY_CHUNK));
      detail.inserted = inserted;
    }
    detail.ms = now() - started;
    return { status: "ok", detail };
  }

  return { runNotify };
}

// ─── 운영 저장소(Supabase service role) ─────────────────────────────────────

function requireDb() {
  const db = getSupabase();
  if (!db) throw new Error("supabase_unavailable");
  return db;
}

type Page<T> = { data: T[] | null; error: { message: string } | null };

/** range() 반복 읽기. 오류면 던진다(일부만 읽고 ok 로 남지 않게) */
async function readAll<T>(label: string, build: (from: number, to: number) => PromiseLike<Page<T>>, pageSize = 1000, maxRows = 50_000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(`${label}: ${error.message}`);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < pageSize) return out;
  }
  throw new Error(`${label}: more than ${maxRows} rows`);
}

export const supabaseNotifyStore: NotifyStore = {
  async videos(date) {
    const db = requireDb();
    return readAll<NotifySourceRow>("breakout_videos", (from, to) =>
      db
        .from("breakout_videos")
        .select("video_id,title,channel_id,channel_title,thumbnail,view_count,ratio,outlier,kind,category_id,video_format,duration_sec")
        .eq("snapshot_date", date)
        .order("video_id")
        .range(from, to),
    );
  },

  async keywords() {
    const db = requireDb();
    return readAll<WatchKeywordRow>("watch_keywords", (from, to) =>
      db.from("watch_keywords").select("user_id,term,term_norm").order("user_id").order("term_norm").range(from, to),
    );
  },

  async channels() {
    const db = requireDb();
    return readAll<WatchChannelRow>("watch_channels", (from, to) =>
      db.from("watch_channels").select("user_id,channel_id").order("user_id").order("channel_id").range(from, to),
    );
  },

  async insertIgnore(rows) {
    if (!rows.length) return 0;
    const { data, error } = await requireDb()
      .from("notifications")
      .upsert(rows, { onConflict: "user_id,video_id,kind", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(`notifications insert: ${error.message}`);
    return data?.length ?? 0;
  },
};

export const notify = createNotify({ store: () => supabaseNotifyStore });

/** jobs 레지스트리에 등록하는 단계 정의(scope 'date': 처리 대상 = snapshot_date, 최근 3일 따라잡기) */
export const notifyStep: StepDef = {
  scope: "date",
  run: (date, { dry }) => notify.runNotify(date, { dry }),
};
