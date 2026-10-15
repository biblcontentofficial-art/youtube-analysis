/**
 * cron 단계 views_d1 · track (A3 조회수 추적, roadmap T5). 테이블은 supabase/migrations/trend_dev.sql 의 breakout_views.
 *
 * views_d1(scope 'date', 따라잡기): copyD1(date)
 *   breakout_videos(snapshot_date = date) 중 집계 대상 행(isCountedRow)이고 collected_at < d1Cutoff(date) 인 행의
 *   view_count 를 breakout_views(day_offset 1, snapshot_date = 게시 날짜, measured_at = 그 행의 collected_at)로
 *   insert on conflict do nothing. 늦게 처리해도(따라잡기) 원래 수집 시각으로 판단하므로 부푼 값을 넣지 않는다.
 *   기한은 rules.ts D1_CUTOFF_DAYS·D1_CUTOFF_KST_HOUR(소유자 결정 2026-10-15: 느슨한 조건, 게시일 2일 뒤 한국 18시 전).
 *
 * track(scope 'run_day', 따라잡기 대상 아님): trackOffsets(runDay)
 *   offset 3 = runDay-3, offset 7 = runDay-7 게시 날짜의 집계 대상 video_id 를 모아, 그 offset 행이 이미 있으면 건너뛰고
 *   videos.list(part=statistics, 50개 묶음, breakout.ts 의 youtubeGet 키 순환)로 재서 upsert(measured_at = 지금).
 *   응답에 없는 id 는 view_count null 로 기록한다(쟀는데 빠짐 = 비공개·삭제). 두 offset 의 id 를 한 줄로 묶어 50개씩 부르므로
 *   호출 수 = ceil((3일 대상 + 7일 대상) ÷ 50), 상한 TRACK_MAX_CALLS(20). 같은 날 다시 돌리면 이미 잰 id 를 빼서 호출 0회.
 *   키 쿼터가 바닥나 응답이 없으면(youtubeGet null) 거기서 멈추고, 잰 것까지는 저장한 뒤 실패로 던진다(trend_jobs failed).
 *   놓친 날은 다시 재지 않는다(3일 뒤 값을 4일 뒤에 재면 뜻이 달라진다).
 *
 * dry 면 DB 를 읽기만 하고 쓰지 않으며, videos.list 도 부르지 않고 호출 계획(calls·units)만 계산한다.
 * 시험: scripts/trend/growth.test.mjs(createTrack 에 모의 저장소·모의 fetchStats 를 넣는다).
 * Node 직접 시험을 위해 상대 경로 import 와 지울 수 있는 타입 문법만 쓴다.
 */
import { getSupabase } from "../supabase";
import { youtubeGet } from "../breakout";
import { TRACK_BATCH, TRACK_MAX_CALLS, d1Cutoff, isCountedRow, type CountedRowLike } from "./rules";
import type { StepDef, StepOutcome } from "./jobs";

export type TrackOffset = 1 | 3 | 7;

/** breakout_videos 에서 읽는 칼럼 */
export type SourceRow = CountedRowLike & {
  video_id: string;
  view_count: number | null;
  collected_at: string;
};

/** breakout_views 한 행 */
export type ViewRow = {
  video_id: string;
  day_offset: TrackOffset;
  snapshot_date: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  measured_at: string;
};

export type VideoStats = { view_count: number | null; like_count: number | null; comment_count: number | null };

/** DB 접근(시험에서는 모의 객체로 바꾼다) */
export interface TrackStore {
  /** breakout_videos(snapshot_date = date) 전체 행(집계 대상 여부는 호출하는 쪽이 거른다) */
  sourceRows(date: string): Promise<SourceRow[]>;
  /** breakout_views 에 이미 있는 (snapshot_date = date, day_offset = offset) 의 video_id */
  measuredIds(date: string, offset: TrackOffset): Promise<Set<string>>;
  /** insert on conflict (video_id, day_offset) do nothing. 새로 들어간 행 수 */
  insertIgnore(rows: ViewRow[]): Promise<number>;
  /** upsert on conflict (video_id, day_offset). 쓴 행 수 */
  upsert(rows: ViewRow[]): Promise<number>;
}

/** id 묶음 → video_id 별 통계. 응답이 없으면(키 쿼터 소진·네트워크) null */
export type FetchStats = (ids: string[]) => Promise<Map<string, VideoStats> | null>;

/** 'YYYY-MM-DD' 에 n 일을 더한다 */
export function shiftDate(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function createTrack({ store, fetchStats, now = () => Date.now() }: { store: () => TrackStore; fetchStats: FetchStats; now?: () => number }) {
  /**
   * views_d1: date 의 집계 대상 행 중 기한 안에 수집된 행을 day 1 로 복사한다.
   * 집계 대상 행이 없으면 skipped(no_breakout_rows), 기한 안 행이 없으면 skipped(late_collection, 다음 실행 때 다시 본다).
   */
  async function copyD1(date: string, { dry }: { dry: boolean }): Promise<StepOutcome> {
    const started = now();
    const s = store();
    const all = await s.sourceRows(date);
    const counted = all.filter(isCountedRow);
    if (!counted.length) return { status: "skipped", detail: "no_breakout_rows" };

    const cutoff = d1Cutoff(date);
    const cutoffMs = Date.parse(cutoff);
    const inTime = counted.filter((r) => {
      const t = Date.parse(r.collected_at);
      return Number.isFinite(t) && t < cutoffMs && r.view_count != null;
    });
    const base = { counted: counted.length, videos: inTime.length, late: counted.length - inTime.length, cutoff };
    if (!inTime.length) return { status: "skipped", detail: { reason: "late_collection", ...base } };

    const existing = await s.measuredIds(date, 1);
    const todo = inTime.filter((r) => !existing.has(r.video_id));
    const detail: Record<string, unknown> = { ...base, existing: inTime.length - todo.length };

    if (dry) {
      detail.would_insert = todo.length;
    } else {
      const rows: ViewRow[] = todo.map((r) => ({
        video_id: r.video_id,
        day_offset: 1,
        snapshot_date: date,
        view_count: num(r.view_count),
        like_count: null,
        comment_count: null,
        measured_at: new Date(r.collected_at).toISOString(),
      }));
      detail.inserted = rows.length ? await s.insertIgnore(rows) : 0;
    }
    detail.ms = now() - started;
    return { status: "ok", detail };
  }

  /**
   * track: runDay 기준 3일 전·7일 전 게시 날짜를 다시 잰다.
   * 두 날짜 모두 집계 대상 행이 없으면 skipped(no_breakout_rows), 모두 이미 쟀으면 skipped(already_measured, 호출 0회).
   */
  async function trackOffsets(runDay: string, { dry, deadline }: { dry: boolean; deadline?: number }): Promise<StepOutcome> {
    const started = now();
    const s = store();
    const plan: { offset: 3 | 7; date: string; ids: string[]; todo: string[] }[] = [];
    for (const offset of [3, 7] as const) {
      const date = shiftDate(runDay, -offset);
      const ids = [...new Set((await s.sourceRows(date)).filter(isCountedRow).map((r) => r.video_id))].sort();
      const measured = ids.length ? await s.measuredIds(date, offset) : new Set<string>();
      plan.push({ offset, date, ids, todo: ids.filter((id) => !measured.has(id)) });
    }

    const summary = (p: (typeof plan)[number]) => ({ date: p.date, videos: p.ids.length, measured_before: p.ids.length - p.todo.length, todo: p.todo.length });
    const detail: Record<string, unknown> = { offset3: summary(plan[0]), offset7: summary(plan[1]) };

    if (!plan.some((p) => p.ids.length)) return { status: "skipped", detail: { reason: "no_breakout_rows", ...detail, calls: 0, units: 0 } };

    // 두 offset 의 할 일을 한 줄로(같은 영상은 한 게시 날짜에만 있다). 호출 상한을 넘으면 앞에서 자른다.
    const queue = plan.flatMap((p) => p.todo.map((id) => ({ id, offset: p.offset, date: p.date })));
    const limit = TRACK_MAX_CALLS * TRACK_BATCH;
    const work = queue.slice(0, limit);
    if (queue.length > limit) detail.truncated = queue.length - limit;
    const batches: (typeof work)[] = [];
    for (let i = 0; i < work.length; i += TRACK_BATCH) batches.push(work.slice(i, i + TRACK_BATCH));

    if (!batches.length) return { status: "skipped", detail: { reason: "already_measured", ...detail, calls: 0, units: 0 } };

    if (dry) {
      detail.calls = batches.length;
      detail.units = batches.length; // videos.list 1회 = 1 unit
      detail.planned = true; // 호출하지 않고 계획만 계산했다
      detail.ms = now() - started;
      return { status: "ok", detail };
    }

    let calls = 0;
    let written = 0;
    let missing = 0;
    let stopped: string | null = null;
    for (const batch of batches) {
      if (deadline != null && deadline - now() < 5_000) {
        stopped = "time_budget";
        break;
      }
      calls++;
      const stats = await fetchStats(batch.map((b) => b.id));
      if (!stats) {
        stopped = "youtube_unavailable";
        break;
      }
      const at = new Date(now()).toISOString();
      const rows: ViewRow[] = batch.map((b) => {
        const st = stats.get(b.id);
        if (!st) missing++;
        return {
          video_id: b.id,
          day_offset: b.offset,
          snapshot_date: b.date,
          view_count: st?.view_count ?? null,
          like_count: st?.like_count ?? null,
          comment_count: st?.comment_count ?? null,
          measured_at: at,
        };
      });
      written += await s.upsert(rows);
    }

    Object.assign(detail, { calls, units: calls, written, missing, ms: now() - started });
    if (stopped) {
      // 잰 것까지는 저장했다. 실패로 남겨 운영 기록에서 보이게 한다(다음 날은 그날 대상만 잰다)
      throw new Error(`${stopped}: measured ${written}/${work.length}, calls ${calls}`);
    }
    return { status: "ok", detail };
  }

  return { copyD1, trackOffsets };
}

// ─── 운영 저장소(Supabase service role) ─────────────────────────────────────

function requireDb() {
  const db = getSupabase();
  if (!db) throw new Error("supabase_unavailable");
  return db;
}

type Page<T> = { data: T[] | null; error: { message: string } | null };

/** range() 반복 읽기. 오류면 던진다(일부만 읽고 '이미 잼'으로 오판하지 않게) */
async function readAll<T>(label: string, build: (from: number, to: number) => PromiseLike<Page<T>>, pageSize = 1000, maxRows = 20_000): Promise<T[]> {
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

const WRITE_CHUNK = 500;

export const supabaseTrackStore: TrackStore = {
  async sourceRows(date) {
    const db = requireDb();
    return readAll<SourceRow>("breakout_videos", (from, to) =>
      db
        .from("breakout_videos")
        .select("video_id,view_count,collected_at,kind,category_id,outlier")
        .eq("snapshot_date", date)
        .order("video_id")
        .range(from, to),
    );
  },

  async measuredIds(date, offset) {
    const db = requireDb();
    const rows = await readAll<{ video_id: string }>("breakout_views", (from, to) =>
      db.from("breakout_views").select("video_id").eq("snapshot_date", date).eq("day_offset", offset).order("video_id").range(from, to),
    );
    return new Set(rows.map((r) => r.video_id));
  },

  async insertIgnore(rows) {
    const db = requireDb();
    let n = 0;
    for (let i = 0; i < rows.length; i += WRITE_CHUNK) {
      const { data, error } = await db
        .from("breakout_views")
        .upsert(rows.slice(i, i + WRITE_CHUNK), { onConflict: "video_id,day_offset", ignoreDuplicates: true })
        .select("video_id");
      if (error) throw new Error(`breakout_views insert: ${error.message}`);
      n += data?.length ?? 0;
    }
    return n;
  },

  async upsert(rows) {
    const db = requireDb();
    let n = 0;
    for (let i = 0; i < rows.length; i += WRITE_CHUNK) {
      const part = rows.slice(i, i + WRITE_CHUNK);
      const { error } = await db.from("breakout_views").upsert(part, { onConflict: "video_id,day_offset" });
      if (error) throw new Error(`breakout_views upsert: ${error.message}`);
      n += part.length;
    }
    return n;
  },
};

/** videos.list(part=statistics) 50개 묶음. breakout.ts 의 youtubeGet(키 순환, 쿼터 소진만 다음 키)을 그대로 쓴다 */
export const youtubeStats: FetchStats = async (ids) => {
  const data = await youtubeGet("videos", { part: "statistics", id: ids.join(","), maxResults: String(TRACK_BATCH) });
  if (!data) return null;
  const out = new Map<string, VideoStats>();
  for (const it of (data.items ?? []) as { id?: string; statistics?: Record<string, unknown> }[]) {
    if (!it?.id) continue;
    out.set(it.id, {
      view_count: num(it.statistics?.viewCount),
      like_count: num(it.statistics?.likeCount),
      comment_count: num(it.statistics?.commentCount),
    });
  }
  return out;
};

export const track = createTrack({ store: () => supabaseTrackStore, fetchStats: youtubeStats });

/** jobs 레지스트리에 등록하는 단계 정의 */
export const viewsD1Step: StepDef = {
  scope: "date",
  run: (date, { dry }) => track.copyD1(date, { dry }),
};

export const trackStep: StepDef = {
  scope: "run_day",
  run: (date, { dry, deadline }) => track.trackOffsets(date, { dry, deadline }),
};
