/**
 * 실사용량 측정 모듈
 *
 * YouTube API 단위 비용 (공식 할당량 계산기 기준):
 *   search.list    = 100 units/call
 *   videos.list    =   1 unit/call
 *   channels.list  =   1 unit/call
 *   playlistItems  =   1 unit/call
 *
 * 모든 tracking은 fire-and-forget (await 없음) — 서비스 응답에 영향 없음
 *
 * Redis 키:
 *   metrics:yt:search:d:{YYYY-MM-DD}    — search.list 호출 수
 *   metrics:yt:videos:d:{YYYY-MM-DD}    — videos.list 호출 수
 *   metrics:yt:channels:d:{YYYY-MM-DD}  — channels.list 호출 수
 *   metrics:yt:playlist:d:{YYYY-MM-DD}  — playlistItems.list 호출 수
 *   metrics:cache:hit:d:{YYYY-MM-DD}    — Redis 캐시 히트 수
 *   metrics:cache:miss:d:{YYYY-MM-DD}   — Redis 캐시 미스 수
 *   metrics:cache:set:d:{YYYY-MM-DD}    — Redis 캐시 쓰기 수
 */

let _redis: import("@upstash/redis").Redis | null = null;

async function getMetricsRedis() {
  if (_redis) return _redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import("@upstash/redis");
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 48시간 TTL (타임존 차이 감안)
const TTL_METRICS = 48 * 3600;

function fireAndForget(fn: () => Promise<void>) {
  void fn().catch(() => {});
}

/** YouTube API 호출 타입 */
export type YtApiType = "search" | "videos" | "channels" | "playlist";

/** YouTube API 호출 기록 (호출 직후 fire-and-forget) */
export function trackYtApi(type: YtApiType) {
  fireAndForget(async () => {
    const r = await getMetricsRedis();
    if (!r) return;
    const key = `metrics:yt:${type}:d:${todayStr()}`;
    await r.incr(key);
    await r.expire(key, TTL_METRICS);
  });
}

/** Redis 캐시 히트/미스/쓰기 기록 */
export function trackCacheOp(type: "hit" | "miss" | "set") {
  fireAndForget(async () => {
    const r = await getMetricsRedis();
    if (!r) return;
    const key = `metrics:cache:${type}:d:${todayStr()}`;
    await r.incr(key);
    await r.expire(key, TTL_METRICS);
  });
}

/** 오늘 YouTube API 실측 지표 읽기 */
export async function getYtApiMetrics(dateStr?: string): Promise<{
  searchCalls: number;
  videosCalls: number;
  channelsCalls: number;
  playlistCalls: number;
  totalUnits: number;
}> {
  const d = dateStr ?? todayStr();
  const r = await getMetricsRedis();
  if (!r) return { searchCalls: 0, videosCalls: 0, channelsCalls: 0, playlistCalls: 0, totalUnits: 0 };
  try {
    const [s, v, c, p] = await r.mget<number[]>(
      `metrics:yt:search:d:${d}`,
      `metrics:yt:videos:d:${d}`,
      `metrics:yt:channels:d:${d}`,
      `metrics:yt:playlist:d:${d}`,
    );
    const searchCalls = s ?? 0;
    const videosCalls = v ?? 0;
    const channelsCalls = c ?? 0;
    const playlistCalls = p ?? 0;
    const totalUnits = searchCalls * 100 + videosCalls * 1 + channelsCalls * 1 + playlistCalls * 1;
    return { searchCalls, videosCalls, channelsCalls, playlistCalls, totalUnits };
  } catch {
    return { searchCalls: 0, videosCalls: 0, channelsCalls: 0, playlistCalls: 0, totalUnits: 0 };
  }
}

/** 오늘 캐시 사용 지표 읽기 */
export async function getCacheMetrics(dateStr?: string): Promise<{
  hits: number;
  misses: number;
  sets: number;
  hitRate: number;
}> {
  const d = dateStr ?? todayStr();
  const r = await getMetricsRedis();
  if (!r) return { hits: 0, misses: 0, sets: 0, hitRate: 0 };
  try {
    const [h, m, s] = await r.mget<number[]>(
      `metrics:cache:hit:d:${d}`,
      `metrics:cache:miss:d:${d}`,
      `metrics:cache:set:d:${d}`,
    );
    const hits = h ?? 0;
    const misses = m ?? 0;
    const sets = s ?? 0;
    const total = hits + misses;
    const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;
    return { hits, misses, sets, hitRate };
  } catch {
    return { hits: 0, misses: 0, sets: 0, hitRate: 0 };
  }
}
