/**
 * 브레이크아웃 — 주제와 상관없이 "구독자 대비 조회수가 잘 나온" 최신 영상을 매일 모은다.
 *
 * 수집(cron): 한국 시간 하루(date) 동안 게시된 한국 영상을
 *   1) search.list(order=viewCount, 영상 길이 3구간 × 최대 4쪽)
 *   2) videos.list chart=mostPopular(카테고리별 1쪽, 그날 게시분만)
 * 으로 모은 뒤 조회수·구독자를 붙여 breakout_videos 에 저장한다(같은 날짜는 덮어씀).
 * 화면에는 원본 값(조회수·구독자·게시일)만 보여 주고, 조회수÷구독자는 정렬·필터에만 쓴다.
 */
import { getSupabase } from "@/lib/supabase";

export interface BreakoutVideo {
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  channel_thumb: string | null;
  thumbnail: string | null;
  published_at: string;
  duration_sec: number;
  view_count: number;
  subscriber_count: number;
  ratio: number;
  /** 채널 평균 조회수(누적 조회수 ÷ 영상 수). 칼럼 추가 전 수집분은 null */
  channel_avg_views: number | null;
  /** 아웃라이어 배수 = 조회수 ÷ 채널 평균 조회수 */
  outlier: number | null;
  /** 걸러 낼 수 있는 채널 종류(news·shopping·issue). 일반 채널은 null */
  kind: BreakoutKind | null;
}

export type BreakoutKind = "news" | "shopping" | "issue";

/**
 * 뉴스·정치 / 홈쇼핑 / 이슈 채널 판정. 화면의 '뉴스·홈쇼핑·정치·이슈 제외'(기본 켜짐)가 이 값으로 거른다.
 * - news: 유튜브 카테고리 25(뉴스·정치) 또는 채널 이름에 언론·시사 단어
 * - shopping: 채널 이름에 홈쇼핑·쇼핑·커머스
 * - issue: 채널 이름에 이슈·논란·사건·렉카
 */
const NEWS_CH = /뉴스|news|ytn|연합|일보|신문|시사|정치|국회|속보|tv조선|채널a|mbn|jtbc|브리핑|헤럴드|경제tv|더팩트|오마이|노컷|뉴시스|한겨레|매일경제|한국경제|머니투데이|비디오머그|스브스|엠빅|세계는지금|시사기획|PD수첩|그것이 알고싶다/i;
const SHOP_CH = /홈쇼핑|쇼핑|shopping|커머스|commerce|라이브쇼/i;
const ISSUE_CH = /이슈|논란|사건|렉카/i;
export function classifyChannel(categoryId: string | undefined, channelTitle: string): BreakoutKind | null {
  if (SHOP_CH.test(channelTitle)) return "shopping";
  if (categoryId === "25" || NEWS_CH.test(channelTitle)) return "news";
  if (ISSUE_CH.test(channelTitle)) return "issue";
  return null;
}

const API = "https://www.googleapis.com/youtube/v3";

function apiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.YOUTUBE_API_KEY) keys.push(process.env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) { const k = process.env[`YOUTUBE_API_KEY_${i}`]; if (k) keys.push(k); }
  for (let i = 1; i <= 10; i++) { const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`]; if (k) keys.push(k); }
  return keys;
}

/** 키를 돌려 가며 호출한다. 쿼터 소진(403 quota)만 다음 키로 넘긴다. */
let keyIndex = 0;
async function yt(path: string, params: Record<string, string>): Promise<any | null> {
  const keys = apiKeys();
  for (let tries = 0; tries < keys.length; tries++) {
    const key = keys[(keyIndex + tries) % keys.length];
    const qs = new URLSearchParams({ ...params, key }).toString();
    const res = await fetch(`${API}/${path}?${qs}`, { cache: "no-store" });
    if (res.ok) { keyIndex = (keyIndex + tries) % keys.length; return res.json(); }
    const body = await res.json().catch(() => ({}));
    const reason = String(body?.error?.errors?.[0]?.reason ?? "").toLowerCase();
    if (res.status === 403 && reason.includes("quota") || reason === "dailylimitexceeded") continue;
    return null; // 그 밖의 오류는 이 호출만 건너뛴다
  }
  return null;
}

/** 'YYYY-MM-DD'(한국 시간) → 그날 0시~다음날 0시의 UTC ISO */
export function kstDayRange(date: string): { after: string; before: string } {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 86400_000);
  return { after: start.toISOString(), before: end.toISOString() };
}

/** 지금 기준 한국 시간 날짜 'YYYY-MM-DD' (offsetDays 만큼 이동) */
export function kstToday(offsetDays = 0): string {
  return new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
}

function parseDuration(iso: string): number {
  const m = iso?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function searchIds(after: string, before: string, videoDuration: string, pages: number): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = "";
  for (let p = 0; p < pages; p++) {
    const data = await yt("search", {
      part: "id", type: "video", regionCode: "KR", relevanceLanguage: "ko", order: "viewCount",
      publishedAfter: after, publishedBefore: before, maxResults: "50", videoDuration,
      ...(pageToken ? { pageToken } : {}),
    });
    if (!data) break;
    for (const it of data.items ?? []) if (it.id?.videoId) ids.push(it.id.videoId);
    pageToken = data.nextPageToken ?? "";
    if (!pageToken) break;
  }
  return ids;
}

const HANGUL = /[\uAC00-\uD7A3]/;
/** 한국 유튜브 씬만: 제목이나 채널명에 한글, 자동 생성 음원 채널(- Topic) 제외, 조회수 1천 미만 제외 */
function isKoreanScene(sn: any, views: number): boolean {
  if (views < MIN_VIEWS) return false;
  if (/ - Topic$/.test(sn.channelTitle ?? "")) return false;
  if (isBlocked(sn.title)) return false;
  return HANGUL.test(sn.title ?? "") || HANGUL.test(sn.channelTitle ?? "");
}
const MIN_VIEWS = 1000;
/** 도박·광고성 영상 제외 */
const BLOCK = /홀덤|바둑이|섯다|토토|카지노|바카라|슬롯|파워볼|타짜엔터/;
const isBlocked = (title?: string) => BLOCK.test(title ?? "");

const POPULAR_CATEGORIES = ["", "1", "10", "17", "20", "22", "23", "24", "25", "26", "27", "28"];

export async function collectBreakout(date: string, opts: { dryRun?: boolean } = {}): Promise<{ date: string; candidates: number; saved: number; sample?: unknown[] }> {
  const { after, before } = kstDayRange(date);
  const afterMs = Date.parse(after), beforeMs = Date.parse(before);

  // 1) 후보 영상 ID
  const searchSets = await Promise.all(["short", "medium", "long"].map((d) => searchIds(after, before, d, 4)));
  const popular = await Promise.all(POPULAR_CATEGORIES.map((c) =>
    yt("videos", { part: "id,snippet", chart: "mostPopular", regionCode: "KR", maxResults: "50", ...(c ? { videoCategoryId: c } : {}) })));
  const popularIds = popular.flatMap((d) => (d?.items ?? [])
    .filter((v: any) => { const t = Date.parse(v.snippet?.publishedAt); return t >= afterMs && t < beforeMs; })
    .map((v: any) => v.id));
  const ids = [...new Set([...searchSets.flat(), ...popularIds])];

  // 2) 영상 상세
  const videoPages = await Promise.all(chunk(ids, 50).map((g) =>
    yt("videos", { part: "snippet,statistics,contentDetails", id: g.join(","), maxResults: "50" })));
  const videos = videoPages.flatMap((d) => d?.items ?? [])
    .filter((v: any) => { const t = Date.parse(v.snippet?.publishedAt); return t >= afterMs && t < beforeMs && v.statistics?.viewCount; });

  // 3) 채널 구독자
  const channelIds = [...new Set(videos.map((v: any) => v.snippet.channelId as string))];
  const channelPages = await Promise.all(chunk(channelIds, 50).map((g) =>
    yt("channels", { part: "snippet,statistics", id: g.join(","), maxResults: "50" })));
  const channels = new Map<string, { subs: number; thumb: string | null; avg: number }>();
  for (const c of channelPages.flatMap((d) => d?.items ?? [])) {
    if (c.statistics?.hiddenSubscriberCount) continue;
    const total = Number(c.statistics?.viewCount ?? 0), count = Number(c.statistics?.videoCount ?? 0);
    channels.set(c.id, { subs: Number(c.statistics?.subscriberCount ?? 0), thumb: c.snippet?.thumbnails?.default?.url ?? null, avg: count > 0 ? total / count : 0 });
  }

  const rows = videos.flatMap((v: any) => {
    const ch = channels.get(v.snippet.channelId);
    if (!ch || ch.subs <= 0) return [];
    const views = Number(v.statistics.viewCount);
    if (!isKoreanScene(v.snippet, views)) return [];
    const th = v.snippet.thumbnails ?? {};
    return [{
      snapshot_date: date,
      video_id: v.id,
      title: v.snippet.title,
      channel_id: v.snippet.channelId,
      channel_title: v.snippet.channelTitle,
      channel_thumb: ch.thumb,
      thumbnail: (th.medium ?? th.high ?? th.default)?.url ?? `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
      published_at: v.snippet.publishedAt,
      duration_sec: parseDuration(v.contentDetails?.duration),
      view_count: views,
      subscriber_count: ch.subs,
      ratio: views / ch.subs,
      channel_avg_views: ch.avg > 0 ? ch.avg : null,
      outlier: ch.avg > 0 ? views / ch.avg : null,
      category_id: v.snippet.categoryId ?? null,
      kind: classifyChannel(v.snippet.categoryId, v.snippet.channelTitle ?? ""),
      collected_at: new Date().toISOString(),
    }];
  });

  if (opts.dryRun) {
    const top = [...rows].sort((a, b) => b.ratio - a.ratio).slice(0, 15)
      .map((r) => ({ title: r.title, ch: r.channel_title, views: r.view_count, subs: r.subscriber_count }));
    return { date, candidates: ids.length, saved: rows.length, sample: top };
  }
  const db = getSupabase();
  if (!db) throw new Error("DB not configured");
  for (const g of chunk(rows, 500)) {
    const { error } = await db.from("breakout_videos").upsert(g, { onConflict: "snapshot_date,video_id" });
    if (error) throw new Error(error.message);
  }
  return { date, candidates: ids.length, saved: rows.length };
}

export type BreakoutSort = "ratio" | "outlier" | "views" | "subs" | "recent";
export type BreakoutType = "all" | "long" | "shorts";

/** 쇼츠 기준: 3분 이하(유튜브 쇼츠 최대 길이) */
export const SHORTS_MAX_SEC = 180;

export async function getBreakout(opts: {
  date: string; sort: BreakoutSort; type: BreakoutType; minRatio: number; limit?: number;
  /** 뉴스·홈쇼핑·정치·이슈 채널 제외 */
  excludeKinds?: boolean;
}): Promise<BreakoutVideo[]> {
  const db = getSupabase();
  if (!db) return [];
  const BASE_COLS = "video_id,title,channel_id,channel_title,channel_thumb,thumbnail,published_at,duration_sec,view_count,subscriber_count,ratio";
  const col = { ratio: "ratio", outlier: "outlier", views: "view_count", subs: "subscriber_count", recent: "published_at" }[opts.sort];
  const run = (cols: string, orderCol: string, withKind: boolean) => {
    let q = db.from("breakout_videos").select(cols).eq("snapshot_date", opts.date).gte("ratio", opts.minRatio);
    if (withKind && opts.excludeKinds) q = q.is("kind", null);
    if (opts.type === "shorts") q = q.lte("duration_sec", SHORTS_MAX_SEC);
    if (opts.type === "long") q = q.gt("duration_sec", SHORTS_MAX_SEC);
    return q.order(orderCol, { ascending: false, nullsFirst: false }).limit(opts.limit ?? 600);
  };
  let { data, error } = await run(`${BASE_COLS},channel_avg_views,outlier,kind`, col, true);
  // kind·outlier 칼럼을 아직 만들지 않은 DB(마이그레이션 전)에서도 목록은 보이게 한다
  if (error) ({ data, error } = await run(`${BASE_COLS},channel_avg_views,outlier`, col, false));
  if (error) ({ data } = await run(BASE_COLS, col === "outlier" ? "ratio" : col, false));
  return ((data ?? []) as unknown as BreakoutVideo[])
    .map((v) => ({ ...v, channel_avg_views: v.channel_avg_views ?? null, outlier: v.outlier ?? null, kind: v.kind ?? null }))
    // 칼럼이 없을 때도 이름 판정으로 거른다
    .filter((v) => !opts.excludeKinds || (v.kind ?? classifyChannel(undefined, v.channel_title)) === null)
    .filter((v) => !isBlocked(v.title));
}

/** 수집된 날짜 목록(최근 순) */
export async function getBreakoutDates(limit = 30): Promise<string[]> {
  const db = getSupabase();
  if (!db) return [];
  const out: string[] = [];
  // 날짜별로 하나씩만 필요해 최근 날짜부터 거꾸로 확인한다(최대 limit 일)
  for (let i = 0; i < limit + 5 && out.length < limit; i++) {
    const d = kstToday(-i);
    const { count } = await db.from("breakout_videos").select("video_id", { count: "exact", head: true }).eq("snapshot_date", d);
    if (count) out.push(d);
    if (i > 14 && out.length === 0) break;
  }
  return out;
}
