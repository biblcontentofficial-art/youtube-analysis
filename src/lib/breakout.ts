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
  /** long(가로 롱폼) | shorts(3분 이하) | vertical(3분 넘는 세로) | live(라이브·다시보기). 칼럼 추가 전 수집분은 null */
  video_format?: VideoFormat | null;
}

export type VideoFormat = "long" | "shorts" | "vertical" | "live";

/**
 * 영상 형태 판정(브레이크아웃 영상 탭은 long 만 보인다. 소유자 결정 2026-10-16: 숏폼·세로·라이브 제외).
 * live: liveStreamingDetails 가 있거나 지금 라이브·예정 / vertical: 플레이어 비율이 세로(embedHeight > embedWidth) /
 * shorts: 3분 이하 / 그 밖 long. videos.list 는 part=player 와 maxWidth 를 줘야 embedWidth·embedHeight 가 온다.
 */
export function videoFormatOf(v: any, durationSec: number): VideoFormat {
  const lbc = v?.snippet?.liveBroadcastContent;
  if (v?.liveStreamingDetails || lbc === "live" || lbc === "upcoming") return "live";
  const w = Number(v?.player?.embedWidth ?? 0), h = Number(v?.player?.embedHeight ?? 0);
  if (w > 0 && h > w) return "vertical";
  if (durationSec <= SHORTS_MAX_SEC) return "shorts";
  return "long";
}

/** videos.list 형태 판정용 파라미터(part 에 player·liveStreamingDetails, maxWidth 필수) */
const FORMAT_PARTS = { part: "snippet,statistics,contentDetails,player,liveStreamingDetails", maxWidth: "1280" };

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

const yt = (path: string, params: Record<string, string>) => youtubeGet(path, params);

const API = "https://www.googleapis.com/youtube/v3";

/**
 * 백그라운드 작업(브레이크아웃 수집·트렌드 추적·홈 채널 실적)용 키 순서: 무료 키를 뒤에서부터 쓴다.
 * 사용자 검색(src/lib/youtube.ts)은 앞 키부터 쓰므로, 매일 수집이 앞 키의 검색 한도를 먼저 다 써 버리지 않게 한다.
 */
function apiKeys(): string[] {
  const free: string[] = [];
  if (process.env.YOUTUBE_API_KEY) free.push(process.env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) { const k = process.env[`YOUTUBE_API_KEY_${i}`]; if (k) free.push(k); }
  const paid: string[] = [];
  for (let i = 1; i <= 10; i++) { const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`]; if (k) paid.push(k); }
  return [...free.reverse(), ...paid];
}

/** 키를 돌려 가며 호출한다. 쿼터 소진(403 quota·429)만 다음 키로 넘긴다. 홈 채널 실적(proofChannels)도 같이 쓴다. */
let keyIndex = 0;
export async function youtubeGet(
  path: string,
  params: Record<string, string>,
  /** 기본은 매번 새로 받기. 정적 페이지(ISR)에서 쓸 때는 { next: { revalidate } } 를 넘긴다(no-store 는 정적 생성을 막는다) */
  init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = { cache: "no-store" },
): Promise<any | null> {
  const keys = apiKeys();
  for (let tries = 0; tries < keys.length; tries++) {
    const key = keys[(keyIndex + tries) % keys.length];
    const qs = new URLSearchParams({ ...params, key }).toString();
    const res = await fetch(`${API}/${path}?${qs}`, init);
    if (res.ok) { keyIndex = (keyIndex + tries) % keys.length; return res.json(); }
    const body = await res.json().catch(() => ({}));
    const reason = String(body?.error?.errors?.[0]?.reason ?? "").toLowerCase();
    if (res.status === 429 || (res.status === 403 && reason.includes("quota")) || reason === "dailylimitexceeded") continue;
    if (reason === "keyinvalid" || String(body?.error?.message ?? "").includes("API key not valid")) continue; // 무효 키는 건너뛴다
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
    yt("videos", { ...FORMAT_PARTS, id: g.join(","), maxResults: "50" })));
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
      video_format: videoFormatOf(v, parseDuration(v.contentDetails?.duration)),
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
  const limit = opts.limit ?? 600;
  // 뒤에서 이름 판정·차단어로 몇 개가 빠지므로 조금 넉넉히 읽고 limit 개로 자른다
  const fetchN = limit + 40;
  const run = (cols: string, orderCol: string, withKind: boolean, withFormat: boolean) => {
    let q = db.from("breakout_videos").select(cols).eq("snapshot_date", opts.date).gte("ratio", opts.minRatio);
    if (withKind && opts.excludeKinds) q = q.is("kind", null);
    if (opts.type === "shorts") q = q.lte("duration_sec", SHORTS_MAX_SEC);
    // 롱폼 = 가로·3분 초과·라이브 아님(video_format 'long'). 칼럼이 없으면 길이로만 거른다
    if (opts.type === "long") q = withFormat ? q.eq("video_format", "long") : q.gt("duration_sec", SHORTS_MAX_SEC);
    return q.order(orderCol, { ascending: false, nullsFirst: false }).limit(fetchN);
  };
  let { data, error } = await run(`${BASE_COLS},channel_avg_views,outlier,kind,video_format`, col, true, true);
  // video_format·kind·outlier 칼럼을 아직 만들지 않은 DB(마이그레이션 전)에서도 목록은 보이게 한다
  if (error) ({ data, error } = await run(`${BASE_COLS},channel_avg_views,outlier,kind`, col, true, false));
  if (error) ({ data, error } = await run(`${BASE_COLS},channel_avg_views,outlier`, col, false, false));
  if (error) ({ data } = await run(BASE_COLS, col === "outlier" ? "ratio" : col, false, false));
  return ((data ?? []) as unknown as BreakoutVideo[])
    .map((v) => ({ ...v, channel_avg_views: v.channel_avg_views ?? null, outlier: v.outlier ?? null, kind: v.kind ?? null }))
    // 칼럼이 없을 때도 이름 판정으로 거른다
    .filter((v) => !opts.excludeKinds || (v.kind ?? classifyChannel(undefined, v.channel_title)) === null)
    .filter((v) => !isBlocked(v.title))
    .slice(0, limit);
}

/**
 * 한 날짜에서 video_format 이 비어 있는 행(칼럼 추가 전 수집분)을 판정해 채운다. videos.list 만 쓴다(50개당 1 unit).
 * 응답에서 빠진 영상(비공개·삭제)은 비워 둔다. 반환: 형태별 개수.
 */
export async function backfillVideoFormats(date: string): Promise<Record<string, number>> {
  const db = getSupabase();
  if (!db) throw new Error("DB not configured");
  const { data, error } = await db.from("breakout_videos").select("video_id,duration_sec").eq("snapshot_date", date).is("video_format", null).limit(2000);
  if (error) throw new Error(error.message);
  const dur = new Map((data ?? []).map((r: any) => [r.video_id as string, r.duration_sec as number]));
  const byFormat: Record<VideoFormat, string[]> = { long: [], shorts: [], vertical: [], live: [] };
  const pages = await Promise.all(chunk([...dur.keys()], 50).map((g) => yt("videos", { ...FORMAT_PARTS, id: g.join(","), maxResults: "50" })));
  for (const v of pages.flatMap((d) => d?.items ?? [])) byFormat[videoFormatOf(v, dur.get(v.id) ?? 0)].push(v.id);
  const out: Record<string, number> = { checked: dur.size };
  for (const [fmt, ids] of Object.entries(byFormat)) {
    out[fmt] = ids.length;
    for (const g of chunk(ids, 200)) {
      const { error: e } = await db.from("breakout_videos").update({ video_format: fmt }).eq("snapshot_date", date).in("video_id", g);
      if (e) throw new Error(e.message);
    }
  }
  return out;
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
