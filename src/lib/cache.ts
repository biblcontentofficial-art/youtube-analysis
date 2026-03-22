/**
 * Upstash Redis 캐시 래퍼
 * 환경변수가 없으면 no-op으로 동작 (캐시 미스로 처리)
 */

let redis: import("@upstash/redis").Redis | null = null;

async function getRedis() {
  if (redis) return redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// TTL 상수 (초 단위)
export const TTL = {
  SEARCH:   60 * 60 * 24, // 검색 결과: 24시간 (API 쿼터 절감)
  TRENDING: 60 * 60,      // 트렌드: 1시간 (시간별 갱신)
  VIDEO:    60 * 60 * 24, // 영상 상세: 24시간
  CHANNEL:  60 * 60 * 24, // 채널 상세: 24시간
  COMMENT:  60 * 60 * 12, // 댓글: 12시간
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = await getRedis();
  if (!r) return null;
  try {
    return await r.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = TTL.SEARCH,
): Promise<void> {
  const r = await getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttl });
  } catch {
    // 캐시 실패해도 서비스 계속
  }
}

export function searchCacheKey(query: string, filter: string, pageToken?: string, order?: string, regionCode?: string): string {
  return `yt:v3:${query.toLowerCase().trim()}:${filter || "all"}:${order || "relevance"}:${pageToken || "first"}:${regionCode || "KR"}`;
}

export function videoCacheKey(videoId: string): string {
  return `yt:video:${videoId}`;
}

export function channelCacheKey(channelId: string): string {
  return `yt:channel:${channelId}`;
}

export function channelSearchCacheKey(query: string): string {
  return `yt:chsearch:v2:${query.toLowerCase().trim()}`;
}

export function channelDetailCacheKey(channelId: string): string {
  return `yt:chdetail:${channelId}`;
}

export function channelVideosCacheKey(channelId: string): string {
  return `yt:chvideos:${channelId}`;
}

export function trendingCacheKey(regionCode = "KR", maxResults = 50, categoryId = ""): string {
  return `yt:trending:${regionCode}:${maxResults}:${categoryId || "all"}`;
}

export function commentCacheKey(videoId: string): string {
  return `yt:comments:${videoId}`;
}
