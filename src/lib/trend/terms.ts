/**
 * cron 단계 terms(A1 데이터, roadmap T2): 그날 breakout_videos 제목을 토큰화해 breakout_terms 를 채운다(API 비용 0).
 *
 * 1. breakout_videos 에서 snapshot_date = date 인 행을 range() 로 끝까지 읽고 집계 대상 행(isCountedRow)만 남긴다.
 * 2. 1차: 모든 제목을 조사 떼기 없이(불용어도 남긴 채) 토큰화해 그날 bareForms 를 만든다.
 *    여기에 최근 30일 breakout_terms 의 term(같은 날짜 제외)과 불용어를 더한다(불용어+조사 → 어간이 불용어라 버려지게).
 * 3. 2차: bareForms 를 넘겨 다시 토큰화하고 format(long|shorts)·term_type(word|tag)별로 서로 다른 채널 수를 센다.
 * 4. dry 가 아니면 format 마다 rpc replace_breakout_terms 한 번(그 날짜·format 삭제+삽입이 한 트랜잭션, 다시 돌려도 행 수 같음).
 *
 * 그날 집계 대상 행이 0이면 skipped(no_breakout_rows) 로 끝나고 따라잡기가 다음 실행 때 다시 본다.
 * jobs.ts 와 같은 이유로(Node 직접 시험) 상대 경로 import 와 지울 수 있는 타입 문법만 쓴다.
 *
 * 백필(배포 뒤 한 번, 운영, 소유자 승인 후): /api/cron/trend?step=terms&date=2026-10-07 … 2026-10-14 를 날짜마다 한 번씩.
 * 2026-10-14 는 T2 로컬 시험에서 이미 ok 로 기록되어 따라잡기가 건너뛰므로, 백필 때 10-14 도 반드시 다시 돌린다.
 * 그 뒤로는 step=data 의 따라잡기가 최근 3일을 맡는다. 같은 날짜를 다시 돌려도 결과 행 수는 같다.
 */
import { getSupabase } from "../supabase";
import { tokenizeTitle } from "./tokenize";
import { ALLOW_TERMS, GENERIC_WORDS, SHORTS_MAX_SEC, STOP_WORDS, TAG_STOP, TOKEN_RULES, isCountedRow, isLegacyRow } from "./rules";
import type { StepDef, StepOutcome } from "./jobs";

export type BreakoutTitleRow = {
  video_id: string;
  title: string | null;
  channel_id: string | null;
  channel_title?: string | null;
  duration_sec: number | null;
  view_count: number | null;
  kind: string | null;
  category_id: string | number | null;
  outlier: number | null;
};

export type TermFormat = "long" | "shorts";
export type TermType = "word" | "tag";
export type TermRow = {
  term: string;
  term_type: TermType;
  channel_count: number;
  video_count: number;
  channel_ids: string[];
  sample_video_ids: string[];
};

/** 누적 사전으로 읽는 기간(같은 날짜 제외) */
export const HISTORY_DAYS = 30;
/** 대표 영상 수(조회수 순) */
export const SAMPLE_VIDEOS = 3;
/** replace_breakout_terms 본문이 이보다 크면 channel_ids 를 잘라 보낸다(channel_count 는 그대로) */
const MAX_PAYLOAD_BYTES = 900_000;
const CAPPED_CHANNEL_IDS = 50;
const TOP_N = 10;

const ROW_COLUMNS = "video_id,title,channel_id,channel_title,duration_sec,view_count,kind,category_id,outlier";

function formatOf(row: BreakoutTitleRow): TermFormat {
  return row.duration_sec != null && row.duration_sec <= SHORTS_MAX_SEC ? "shorts" : "long";
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 'YYYY-MM-DD' 에 n 일을 더한다(UTC 날짜 계산, 날짜 문자열끼리만 쓴다) */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * 순수 집계: 행(이미 isCountedRow 로 거른 것) + 누적 사전 → format 별 단어 행.
 * 정렬은 서로 다른 채널 수 → 영상 수 → 단어 순(같은 입력이면 같은 결과).
 */
export function buildTermRows(rows: BreakoutTitleRow[], history: Iterable<string> = []) {
  // 1차: 그날 조사 없이 나온 형태(불용어 포함) + 누적 사전 + 불용어
  const bare = new Set<string>(history);
  const firstRules = { allowTerms: ALLOW_TERMS, tagStop: TAG_STOP };
  for (const r of rows) {
    if (!r.title) continue;
    const t = tokenizeTitle(r.title, { rules: firstRules });
    for (const w of t.words) bare.add(w);
    for (const w of t.tags) bare.add(w);
  }
  for (const w of STOP_WORDS) bare.add(w);

  // 2차: 조사 떼기 + 불용어
  type Acc = { term: string; term_type: TermType; channels: Set<string>; videos: { id: string; views: number }[] };
  const acc: Record<TermFormat, Map<string, Acc>> = { long: new Map(), shorts: new Map() };
  const videosByFormat: Record<TermFormat, number> = { long: 0, shorts: 0 };

  for (const r of rows) {
    if (!r.title) continue;
    const format = formatOf(r);
    videosByFormat[format]++;
    const t = tokenizeTitle(r.title, { rules: TOKEN_RULES, bareForms: bare });
    const lists: [TermType, string[]][] = [["word", t.words], ["tag", t.tags]];
    for (const [term_type, list] of lists) {
      for (const term of list) {
        const key = `${term_type}\u0000${term}`;
        let a = acc[format].get(key);
        if (!a) {
          a = { term, term_type, channels: new Set(), videos: [] };
          acc[format].set(key, a);
        }
        if (r.channel_id) a.channels.add(r.channel_id);
        a.videos.push({ id: r.video_id, views: r.view_count ?? 0 });
      }
    }
  }

  const toRows = (m: Map<string, Acc>): TermRow[] =>
    [...m.values()]
      .map((a) => ({
        term: a.term,
        term_type: a.term_type,
        channel_count: a.channels.size,
        video_count: a.videos.length,
        channel_ids: [...a.channels].sort(),
        sample_video_ids: [...a.videos]
          .sort((x, y) => y.views - x.views || cmp(x.id, y.id))
          .slice(0, SAMPLE_VIDEOS)
          .map((v) => v.id),
      }))
      .sort((x, y) => y.channel_count - x.channel_count || y.video_count - x.video_count || cmp(x.term, y.term) || cmp(x.term_type, y.term_type));

  return { long: toRows(acc.long), shorts: toRows(acc.shorts), bareSize: bare.size, videosByFormat };
}

/** 상위 n 개 요약(detail 용) */
function top(rows: TermRow[], n = TOP_N) {
  return rows.slice(0, n).map((r) => ({ term: r.term, type: r.term_type, channels: r.channel_count, videos: r.video_count }));
}

/** 본문이 너무 크면 channel_ids 를 50개로 자른다(channel_count 는 그대로) */
function fitPayload(rows: TermRow[]): { rows: TermRow[]; capped: boolean } {
  const bytes = new TextEncoder().encode(JSON.stringify(rows)).length;
  if (bytes <= MAX_PAYLOAD_BYTES) return { rows, capped: false };
  return { rows: rows.map((r) => ({ ...r, channel_ids: r.channel_ids.slice(0, CAPPED_CHANNEL_IDS) })), capped: true };
}

function requireDb() {
  const db = getSupabase();
  if (!db) throw new Error("supabase_unavailable");
  return db;
}

type Page<T> = { data: T[] | null; error: { message: string } | null };

/**
 * range() 반복 읽기. db.ts selectAllPaged 와 달리 오류면 던진다(일부만 읽고 그날 행을 덮어쓰지 않게).
 * maxRows 까지 읽었는데 마지막 페이지가 가득 차 있으면(뒤에 더 있을 수 있으면) 역시 던진다.
 */
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

/**
 * 최근 30일(같은 날짜 제외) breakout_terms 의 term 집합. 날짜마다 나란히 읽는다(범위 쿼리 하나를 순서대로 넘기는 것보다 빠르다).
 * 30일이 쌓인 뒤 detail.ms 가 10초에 가까워지면 term 만 distinct 로 돌려주는 RPC 로 바꾼다.
 */
async function readHistory(date: string): Promise<Set<string>> {
  const db = requireDb();
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) => addDays(date, -(i + 1)));
  const lists = await Promise.all(
    dates.map((d) =>
      readAll<{ term: string }>("breakout_terms", (from, to) =>
        db.from("breakout_terms").select("term").eq("snapshot_date", d).order("format").order("term_type").order("term").range(from, to),
      ),
    ),
  );
  const out = new Set<string>();
  for (const list of lists) for (const r of list) out.add(r.term);
  return out;
}

export type TermsResult =
  | { status: "skipped"; detail: string }
  | { status: "ok"; detail: Record<string, unknown> };

/**
 * date(YYYY-MM-DD) 의 breakout_terms 를 만든다. dry 면 DB 에 쓰지 않는다(읽기만).
 */
export async function buildTermsForDate(date: string, { dry }: { dry: boolean }): Promise<TermsResult> {
  const started = Date.now();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`bad date ${date}`);
  const db = requireDb();

  const all = await readAll<BreakoutTitleRow>("breakout_videos", (from, to) =>
    db.from("breakout_videos").select(ROW_COLUMNS).eq("snapshot_date", date).order("video_id").range(from, to),
  );
  const counted = all.filter(isCountedRow);
  const excludedLegacy = all.filter(isLegacyRow).length;
  const excludedKind = all.filter((r) => r.kind != null).length;
  if (!counted.length) return { status: "skipped", detail: "no_breakout_rows" };

  // 누적 사전은 보조 자료라 읽기 실패해도 그날 단어만으로 계속한다
  let history = new Set<string>();
  let historyError: string | undefined;
  try {
    history = await readHistory(date);
  } catch (e) {
    historyError = e instanceof Error ? e.message : String(e);
    console.error(`[trend/terms] history ${date}:`, historyError);
  }

  const built = buildTermRows(counted, history);
  const topLong = top(built.long);

  const detail: Record<string, unknown> = {
    rows: all.length,
    videos: counted.length,
    videos_long: built.videosByFormat.long,
    videos_shorts: built.videosByFormat.shorts,
    excluded_legacy: excludedLegacy,
    excluded_kind: excludedKind,
    terms_long: built.long.length,
    terms_shorts: built.shorts.length,
    bare_forms: built.bareSize,
    history_terms: history.size,
    top_long: topLong,
    top_shorts: top(built.shorts),
    generic_in_top10: topLong.filter((t) => GENERIC_WORDS.has(t.term)).length,
  };
  if (historyError) detail.history_error = historyError;

  if (!dry) {
    const written: Record<TermFormat, number> = { long: 0, shorts: 0 };
    let capped = false;
    for (const format of ["long", "shorts"] as const) {
      const fit = fitPayload(built[format]);
      capped ||= fit.capped;
      const { data, error } = await db.rpc("replace_breakout_terms", { p_date: date, p_format: format, p_rows: fit.rows });
      if (error) throw new Error(`replace_breakout_terms ${format}: ${error.message}`);
      written[format] = typeof data === "number" ? data : fit.rows.length;
    }
    detail.written = written;
    if (capped) detail.capped_channel_ids = true;
  }

  detail.ms = Date.now() - started;
  return { status: "ok", detail };
}

/** jobs 레지스트리에 등록하는 단계 정의(scope 'date', 따라잡기 대상) */
export const termsStep: StepDef = {
  scope: "date",
  async run(date, { dry }): Promise<StepOutcome> {
    return buildTermsForDate(date, { dry });
  },
};
